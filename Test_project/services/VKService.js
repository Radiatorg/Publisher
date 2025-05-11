const { VK } = require('vk-io');
const db = require("../models");
const axios = require('axios');
const Account = db.Account;
const FormData = require('form-data');

class VKService {
    constructor() {
        this.vk = null;
        this.apiVersion = '5.131';
        this.baseUrl = 'https://api.vk.com/method';
    }

    initialize(token) {
        this.vk = new VK({ token });
        return this.vk;
    }

    async getUserInfo(accessToken) {
        try {
            const response = await axios.get(`${this.baseUrl}/users.get`, {
                params: {
                    access_token: accessToken,
                    v: this.apiVersion,
                    fields: 'photo_200'
                }
            });

            if (response.data.error) {
                throw new Error(response.data.error.error_msg);
            }

            return response.data.response[0];
        } catch (error) {
            console.error('Error getting VK user info:', error);
            throw error;
        }
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

    async getCommunities(accessToken) {
        try {
            console.log('Getting VK communities for token:', accessToken);
            const response = await axios.get(`${this.baseUrl}/groups.get`, {
                params: {
                    access_token: accessToken,
                    v: this.apiVersion,
                    extended: 1,
                    filter: 'admin'
                }
            });

            if (response.data.error) {
                throw new Error(response.data.error.error_msg);
            }

            const communities = response.data.response.items.map(group => ({
                id: group.id.toString(),
                name: group.name,
                type: 'community',
                photo: group.photo_200,
                membersCount: group.members_count || 0
            }));

            console.log('Found communities:', communities.length);
            return communities;
        } catch (error) {
            console.error('Error getting VK communities:', error);
            throw error;
        }
    }

    async createPost(accountId, { text, attachments = [], communityId }) {
        try {
            const response = await axios.post(`${this.baseUrl}/wall.post`, null, {
                params: {
                    owner_id: `-${communityId}`,
                    message: text,
                    attachments: attachments.map(att => att.type + att.file).join(','),
                    v: this.apiVersion
                }
            });

            if (response.data.error) {
                throw new Error(response.data.error.error_msg);
            }

            return {
                id: response.data.response.post_id.toString(),
                success: true
            };
        } catch (error) {
            console.error('Error creating VK post:', error);
            throw error;
        }
    }

    async deletePost(accountId, communityId, postId) {
        try {
            const response = await axios.post(`${this.baseUrl}/wall.delete`, null, {
                params: {
                    owner_id: `-${communityId}`,
                    post_id: postId,
                    v: this.apiVersion
                }
            });

            if (response.data.error) {
                throw new Error(response.data.error.error_msg);
            }

            return true;
        } catch (error) {
            console.error('Error deleting VK post:', error);
            throw error;
        }
    }
}

module.exports = new VKService(); 