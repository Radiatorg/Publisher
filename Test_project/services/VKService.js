const { VK } = require('vk-io');
const db = require("../models");
const axios = require('axios');
const Account = db.Account;
const FormData = require('form-data');

class VKService {
    constructor() {
        this.vk = null;
    }

    initialize(token) {
        this.vk = new VK({ token });
        return this.vk;
    }

    async getUserInfo(token) {
        const vk = new VK({ token });
        const userInfo = await vk.api.users.get({
            fields: ['photo_200', 'first_name', 'last_name']
        });
        return userInfo[0];
    }

    async getVKPlatform() {
        const vkPlatform = await db.Platform.findOne({ where: { name: 'vk' } });
        if (!vkPlatform) {
            throw new Error('VK platform not found');
        }
        return vkPlatform;
    }

    async getUserAdminCommunities(token) {
        try {
            const vk = new VK({ token });
            
            // Get all groups where user is a member
            const groups = await vk.api.groups.get({
                extended: 1,
                filter: 'admin'
            });

            // Filter only groups where user is admin
            const adminCommunities = groups.items.map(group => ({
                id: group.id,
                name: group.name,
                screen_name: group.screen_name,
                photo: group.photo_200,
                type: group.type
            }));

            return adminCommunities;
        } catch (error) {
            console.error('Error getting user admin communities:', error);
            throw new Error('Failed to get user admin communities');
        }
    }

    async getAllPosts(groupId, token, limit = 100) {
        try {
            const vk = new VK({ token });
            const posts = [];
            let offset = 0;
            
            while (posts.length < limit) {
                const response = await vk.api.wall.get({
                    owner_id: -groupId, // Отрицательный ID для групп
                    count: Math.min(100, limit - posts.length),
                    offset: offset,
                    extended: 1
                });

                if (!response.items || response.items.length === 0) {
                    break;
                }

                for (const post of response.items) {
                    posts.push({
                        id: post.id,
                        text: post.text,
                        date: post.date,
                        likes: post.likes?.count || 0,
                        reposts: post.reposts?.count || 0,
                        views: post.views?.count || 0,
                        comments: post.comments?.count || 0,
                        attachments: post.attachments?.map(attachment => ({
                            type: attachment.type,
                            url: this.getAttachmentUrl(attachment)
                        })) || [],
                        isPinned: post.is_pinned === 1,
                        isAd: post.marked_as_ads === 1
                    });
                }

                offset += response.items.length;
                if (response.items.length < 100) {
                    break;
                }
            }

            return posts;
        } catch (error) {
            console.error('Error getting VK posts:', error);
            throw new Error('Failed to get VK posts');
        }
    }

    getAttachmentUrl(attachment) {
        switch (attachment.type) {
            case 'photo':
                return attachment.photo.sizes[attachment.photo.sizes.length - 1].url;
            case 'video':
                return `https://vk.com/video${attachment.video.owner_id}_${attachment.video.id}`;
            case 'doc':
                return attachment.doc.url;
            case 'audio':
                return attachment.audio.url;
            case 'link':
                return attachment.link.url;
            default:
                return null;
        }
    }

    async createPost(accountId, postData) {
        try {
            const account = await Account.findByPk(accountId);
            if (!account) {
                throw new Error('Account not found');
            }

            // Инициализируем VK с токеном аккаунта
            this.initialize(account.access_token);

            const { text, attachments = [], communityId } = postData;
            
            // Upload media files if present
            const uploadedAttachments = [];
            for (const attachment of attachments) {
                if (attachment.type === 'photo') {
                    // Получаем сервер для загрузки
                    const uploadServer = await this.vk.api.photos.getWallUploadServer({
                        group_id: communityId
                    });
                    
                    // Создаем FormData для загрузки
                    const formData = new FormData();
                    formData.append('photo', attachment.file, {
                        filename: 'photo.jpg',
                        contentType: 'image/jpeg'
                    });
                    
                    // Загружаем фото на сервер VK
                    const uploadResponse = await axios.post(uploadServer.upload_url, formData, {
                        headers: {
                            ...formData.getHeaders()
                        }
                    });
                    
                    // Парсим JSON строку photo
                    const photoData = JSON.parse(uploadResponse.data.photo);
                    if (!photoData || !photoData[0]) {
                        throw new Error('Invalid photo data received from VK');
                    }
                    
                    // Извлекаем необходимые данные из ответа
                    const { photo, server, hash } = uploadResponse.data;
                    
                    // Сохраняем фото на стене
                    const savedPhoto = await this.vk.api.photos.saveWallPhoto({
                        group_id: communityId,
                        photo: photo,
                        server: server,
                        hash: hash
                    });
                    
                    if (savedPhoto && savedPhoto[0]) {
                        uploadedAttachments.push(`photo${savedPhoto[0].owner_id}_${savedPhoto[0].id}`);
                    }
                }
                // Add support for other attachment types (video, etc.) here
            }

            // Create the post
            const post = await this.vk.api.wall.post({
                owner_id: `-${communityId}`, // Negative ID for groups
                message: text,
                attachments: uploadedAttachments.join(','),
                from_group: 1
            });

            return {
                id: post.post_id,
                success: true
            };
        } catch (error) {
            console.error('Error creating VK post:', error);
            throw new Error(`Failed to create VK post: ${error.message}`);
        }
    }
}

module.exports = new VKService(); 