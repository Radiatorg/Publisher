const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const { Api } = require('telegram/tl');
const { Connection } = require('telegram/network');
const db = require("../models");
const TelegramChannel = db.TelegramChannel;
const input = require('input');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class TelegramUserService {
    constructor() {
        this.clients = new Map(); // Хранит клиенты для разных пользователей
        this.sessionsDir = path.join(__dirname, '../sessions');
        this.cache = new Map(); // Кэш для данных
        this.cacheTimeout = 5 * 60 * 1000; // 5 минут
        
        // Создаем директорию для сессий, если она не существует
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }

    // Получение ключа для кэша
    getCacheKey(method, params) {
        return `${method}-${JSON.stringify(params)}`;
    }

    // Проверка кэша
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            logger.debug('Cache hit:', { key, dataLength: cached.data ? cached.data.length : 0 });
            return cached.data;
        }
        logger.debug('Cache miss:', { key });
        return null;
    }

    // Сохранение в кэш
    setCache(key, data) {
        logger.debug('Setting cache:', { key, dataLength: data ? data.length : 0 });
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    async getClient(userId, apiId, apiHash, sessionString) {
        const key = `${userId}-${apiId}-${apiHash}`;
        
        logger.debug('Getting Telegram client:', { 
            userId, 
            apiId, 
            hasApiHash: !!apiHash,
            hasSession: !!sessionString,
            existingClient: this.clients.has(key)
        });
        
        if (this.clients.has(key)) {
            logger.debug('Using existing client');
            return this.clients.get(key);
        }

        try {
            logger.debug('Creating new client...');
            const session = new StringSession(sessionString);
            const client = new TelegramClient(session, parseInt(apiId), apiHash, {
                connectionRetries: 5,
                useWSS: true,
                autoReconnect: true,
                deviceModel: 'Publisher App',
                systemVersion: 'Windows 10',
                appVersion: '1.0.0',
                langCode: 'en',
                logger: {
                    warn: (message) => logger.warn(message),
                    error: (message) => logger.error(message),
                    info: (message) => logger.info(message),
                    debug: (message) => logger.debug(message)
                }
            });

            logger.debug('Connecting client...');
            await client.connect();
            logger.debug('Client connected successfully');
            
            // Сохраняем сессию в файл для постоянного хранения
            const sessionPath = path.join(this.sessionsDir, `${key}.session`);
            fs.writeFileSync(sessionPath, client.session.save());
            logger.debug('Session saved to file');

            this.clients.set(key, client);
            logger.debug('Client added to cache');
            return client;
        } catch (error) {
            logger.error('Error creating Telegram client:', error);
            throw error;
        }
    }

    async getTelegramData(apiId, apiHash, sessionString) {
        try {
            logger.debug('Getting Telegram data with params:', { apiId, hasApiHash: !!apiHash, hasSession: !!sessionString });
            
            const client = await this.getClient('temp', apiId, apiHash, sessionString);
            const me = await client.getMe();
            
            logger.debug('Got user data:', { 
                id: me.id,
                firstName: me.firstName,
                lastName: me.lastName,
                username: me.username,
                hasPhoto: !!me.photo
            });
            
            const photo = await this.getProfilePhoto(client, me);
            logger.debug('Got profile photo:', { hasPhoto: !!photo });
            
            return {
                firstName: me.firstName,
                lastName: me.lastName,
                username: me.username,
                photo: photo
            };
        } catch (error) {
            logger.error('Error getting Telegram data:', error);
            throw error;
        }
    }

    async getChannels(apiId, apiHash, sessionString) {
        try {
            if (!apiId || !apiHash || !sessionString) {
                throw new Error('API ID, API Hash and session string are required');
            }

            const client = await this.getClient('temp', apiId, apiHash, sessionString);
            const me = await client.getMe();

            // Получаем все диалоги
            const dialogs = await client.getDialogs({
                limit: 100,
                archived: false
            });

            // Фильтруем только каналы
            const channels = dialogs.filter(dialog => dialog.isChannel && dialog.entity.broadcast);

            // Проверяем права администратора для каждого канала
            const adminChannels = await Promise.all(channels.map(async (channel) => {
                try {
                    const fullChannel = await client.getEntity(channel.id);
                    
                    // Получаем информацию об участнике
                    const participant = await client.invoke(new Api.channels.GetParticipant({
                        channel: channel.id,
                        participant: await client.getMe()
                    }));

                    // Проверяем, является ли пользователь администратором
                    const isAdmin = participant.participant.className === 'ChannelParticipantAdmin' ||
                                  participant.participant.className === 'ChannelParticipantCreator';

                    if (isAdmin) {
                        let photoUrl = null;
                        if (channel.photo) {
                            try {
                                const buffer = await client.downloadMedia(channel.photo);
                                photoUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
                            } catch (error) {
                                logger.error('Error downloading channel photo:', error);
                            }
                        }

                        return {
                            id: channel.id.toString(),
                            title: channel.title,
                            username: channel.username,
                            type: 'channel',
                            photo: photoUrl,
                            membersCount: fullChannel.participantsCount || 0,
                            isAdmin: true
                        };
                    }
                    return null;
                } catch (error) {
                    logger.error(`Error checking admin status for channel ${channel.id}:`, error);
                    return null;
                }
            }));

            // Фильтруем null значения и возвращаем только каналы, где пользователь является администратором
            return adminChannels.filter(channel => channel !== null);
        } catch (error) {
            logger.error('Error getting channels:', error);
            throw error;
        }
    }

    async getPosts(userId, apiId, apiHash, channelId, limit = 5) {
        try {
            logger.debug('Starting getPosts with params:', { userId, channelId, limit });
            const cacheKey = this.getCacheKey('posts', { userId, channelId, limit });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger.debug('Returning cached posts:', { count: cached.length });
                return cached;
            }

            // Получаем сессию из базы данных
            const account = await db.Account.findOne({
                where: { id: userId }
            });

            if (!account) {
                logger.error('Account not found:', userId);
                throw new Error('Account not found');
            }

            logger.debug('Found account:', { id: account.id, platform: account.platform_id });

            const telegramData = JSON.parse(account.refresh_token);
            if (!telegramData.apiId || !telegramData.apiHash || !telegramData.session) {
                logger.error('Invalid Telegram data:', {
                    hasApiId: !!telegramData.apiId,
                    hasApiHash: !!telegramData.apiHash,
                    hasSession: !!telegramData.session
                });
                throw new Error('Invalid Telegram session data');
            }

            logger.debug('Initializing Telegram client...');
            const client = await this.getClient(userId, telegramData.apiId, telegramData.apiHash, telegramData.session);
            if (!client) {
                logger.error('Failed to initialize Telegram client');
                throw new Error('Failed to initialize Telegram client');
            }

            logger.debug('Getting channel entity...');
            const channel = await client.getEntity(channelId);
            if (!channel) {
                logger.error('Channel not found:', channelId);
                throw new Error('Channel not found');
            }

            logger.debug('Getting messages from channel...');
            const messages = await client.getMessages(channel, {
                limit: limit
            });
            logger.debug('Got messages:', { count: messages.length, firstMessageId: messages[0]?.id });

            const result = messages
                .filter(message => {
                    // Пропускаем сообщения, которые не являются постами или имеют неподдерживаемый тип
                    if (!message || !message.id) {
                        logger.debug('Skipping message: no id');
                        return false;
                    }
                    if (message.action) {
                        logger.debug('Skipping message: action message');
                        return false;
                    }
                    return true;
                })
                .map(async message => {
                    try {
                        logger.debug('Processing message:', { id: message.id, type: message.className });
                        let attachments = [];
                        
                        // Обрабатываем медиа-вложения
                        if (message.photo) {
                            try {
                                logger.debug('Downloading photo...');
                                const photoBuffer = await client.downloadMedia(message.photo);
                                attachments.push({
                                    type: 'photo',
                                    url: `data:image/jpeg;base64,${photoBuffer.toString('base64')}`
                                });
                                logger.debug('Photo downloaded successfully');
                            } catch (error) {
                                logger.error('Error downloading photo:', error);
                            }
                        } else if (message.video) {
                            try {
                                logger.debug('Downloading video...');
                                const videoBuffer = await client.downloadMedia(message.video);
                                const isGif = message.video.mimeType === 'video/mp4' && message.video.animated;
                                attachments.push({
                                    type: isGif ? 'gif' : 'video',
                                    url: `data:${message.video.mimeType};base64,${videoBuffer.toString('base64')}`,
                                    duration: message.video.duration,
                                    width: message.video.width,
                                    height: message.video.height,
                                    size: message.video.size,
                                    mimeType: message.video.mimeType
                                });
                                logger.debug(`${isGif ? 'GIF' : 'Video'} downloaded successfully`);
                            } catch (error) {
                                logger.error('Error downloading video:', error);
                            }
                        } else if (message.document) {
                            // Проверяем, является ли документ GIF или видео
                            const isGif = message.document.mimeType === 'video/mp4' && message.document.attributes?.some(attr => 
                                attr.className === 'DocumentAttributeAnimated'
                            );
                            const isVideo = message.document.mimeType?.startsWith('video/');
                            
                            if (isGif || isVideo) {
                                try {
                                    logger.debug(`Downloading ${isGif ? 'GIF' : 'video document'}...`);
                                    const mediaBuffer = await client.downloadMedia(message.document);
                                    attachments.push({
                                        type: isGif ? 'gif' : 'video',
                                        url: `data:${message.document.mimeType};base64,${mediaBuffer.toString('base64')}`,
                                        duration: message.document.attributes?.find(attr => 
                                            attr.className === 'DocumentAttributeVideo'
                                        )?.duration,
                                        width: message.document.attributes?.find(attr => 
                                            attr.className === 'DocumentAttributeVideo'
                                        )?.w,
                                        height: message.document.attributes?.find(attr => 
                                            attr.className === 'DocumentAttributeVideo'
                                        )?.h,
                                        size: message.document.size,
                                        mimeType: message.document.mimeType
                                    });
                                    logger.debug(`${isGif ? 'GIF' : 'Video document'} downloaded successfully`);
                                } catch (error) {
                                    logger.error(`Error downloading ${isGif ? 'GIF' : 'video document'}:`, error);
                                }
                            }
                        }

                        const post = {
                            id: message.id.toString(),
                            platform: 'telegram',
                            text: message.text || message.caption || '',
                            date: typeof message.date === 'number' ? message.date : 
                                  message.date instanceof Date ? message.date.getTime() / 1000 :
                                  Date.now() / 1000, // Fallback to current time if date is invalid
                            likes: 0,
                            reposts: message.forwards || 0,
                            views: message.views || 0,
                            comments: 0,
                            forwards: message.forwards || 0,
                            attachments: attachments,
                            isPinned: message.pinned || false,
                            isAd: false,
                            type: 'post',
                            community: {
                                id: channelId.toString(),
                                name: channel.title,
                                photo: channel.photo ? 
                                    `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${channel.photo.big_file_id}` : 
                                    null,
                                type: channel.isChannel ? 'channel' : 'group',
                                platform: 'telegram',
                                accountId: account.id.toString()
                            }
                        };
                        logger.debug('Processed post:', { id: post.id, text: post.text.substring(0, 50) });
                        return post;
                    } catch (error) {
                        logger.error('Error processing message:', error);
                        return null;
                    }
                });

            // Ждем завершения всех асинхронных операций
            const posts = (await Promise.all(result)).filter(post => post !== null);
            logger.debug('Final posts count:', posts.length);

            if (posts.length > 0) {
                this.setCache(cacheKey, posts);
            } else {
                logger.warn('No posts found to cache');
            }

            return posts;
        } catch (error) {
            logger.error('Error getting posts:', error);
            throw new Error('Failed to get posts');
        }
    }

    async createPost(userId, apiId, apiHash, channelId, { text, attachments = [] }) {
        try {
            const client = await this.getClient(userId, apiId, apiHash);
            if (!client) {
                throw new Error('Client not initialized');
            }

            const message = {
                message: text,
                file: attachments.map(file => file.file)
            };

            const result = await client.sendMessage(channelId, message);
            
            // Очищаем кэш постов для этого канала
            const cacheKey = this.getCacheKey('posts', { userId, channelId });
            this.cache.delete(cacheKey);
            
            return result;
        } catch (error) {
            logger.error('Error creating post:', error);
            throw error;
        }
    }

    async deletePost(userId, apiId, apiHash, channelId, postId) {
        try {
            const client = await this.getClient(userId, apiId, apiHash);
            if (!client) {
                throw new Error('Client not initialized');
            }

            await client.deleteMessages(channelId, [postId]);
            
            // Очищаем кэш постов для этого канала
            const cacheKey = this.getCacheKey('posts', { userId, channelId });
            this.cache.delete(cacheKey);
        } catch (error) {
            logger.error('Error deleting post:', error);
            throw error;
        }
    }

    async disconnect(userId) {
        try {
            const client = this.clients.get(userId);
            if (client) {
                await client.disconnect();
                this.clients.delete(userId);
            }
        } catch (error) {
            console.error('Error disconnecting client:', error);
            throw new Error('Failed to disconnect client');
        }
    }

    async getProfilePhoto(client, entity) {
        try {
            logger.debug('Getting profile photo for entity:', { 
                id: entity.id,
                hasPhoto: !!entity.photo,
                photoType: entity.photo ? typeof entity.photo : 'none'
            });
            
            if (!entity.photo) {
                logger.debug('No photo found for entity');
                return null;
            }
            
            const photo = await client.downloadProfilePhoto(entity, {
                isBig: true
            });
            
            logger.debug('Downloaded photo:', { 
                hasPhoto: !!photo,
                photoType: photo ? typeof photo : 'none',
                photoLength: photo ? photo.length : 0
            });
            
            if (!photo) {
                logger.debug('Failed to download photo');
                return null;
            }
            
            // Проверяем, что фото уже в формате base64
            if (photo.toString().startsWith('data:image')) {
                logger.debug('Photo is already in base64 format');
                return photo.toString();
            }
            
            // Если нет, конвертируем в base64
            const base64Photo = `data:image/jpeg;base64,${photo.toString('base64')}`;
            logger.debug('Converted photo to base64:', { 
                length: base64Photo.length,
                startsWith: base64Photo.substring(0, 50) + '...'
            });
            
            return base64Photo;
        } catch (error) {
            logger.error('Error getting profile photo:', error);
            return null;
        }
    }
}

module.exports = new TelegramUserService(); 