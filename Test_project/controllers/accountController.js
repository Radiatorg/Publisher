// controllers/accountController.js
const accountService = require('../services/AccountService');
const vkService = require('../services/VKService');
const TelegramUserService = require('../services/TelegramUserService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

class AccountController {
    constructor() {
        this.telegramService = require('../services/TelegramUserService');
        this.vkService = require('../services/VKService');
    }
    async create(req, res) {
        try {
            const { platform_id, account_sn_id, access_token, refresh_token } = req.body;
            const account = await accountService.createAccount({
            userId : req.user.id,
            platformId : platform_id,
            accountSnId : account_sn_id,
            accessToken : access_token,
            refreshToken : refresh_token
            });
            res.json(account);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getAccounts(req, res) {
        try {
            const accounts = await accountService.getAccounts(req.user.id);
            
            // Получаем данные для каждого аккаунта
            const accountsWithData = await Promise.all(accounts.map(async (account) => {
                const accountData = account.toJSON();
                if (account.platform_id === 1) { // VK
                    try {
                        const userInfo = await this.vkService.getUserInfo(account.access_token);
                        return {
                            ...accountData,
                            platform: {
                                id: 1,
                                name: 'vk'
                            },
                            vkData: {
                                name: `${userInfo.first_name} ${userInfo.last_name}`,
                                photo: userInfo.photo_200
                            }
                        };
                    } catch (error) {
                        console.error('Error fetching VK data:', error);
                        return {
                            ...accountData,
                            platform: {
                                id: 1,
                                name: 'vk'
                            }
                        };
                    }
                } else if (account.platform_id === 2) { // Telegram
                    try {
                        const telegramData = JSON.parse(account.refresh_token);
                        if (!telegramData.apiId || !telegramData.apiHash || !telegramData.session) {
                            logger.error('Invalid Telegram data in account:', account.id);
                            return {
                                ...accountData,
                                platform: {
                                    id: 2,
                                    name: 'telegram'
                                }
                            };
                        }

                        const userData = await this.telegramService.getTelegramData(
                            telegramData.apiId,
                            telegramData.apiHash,
                            telegramData.session
                        );

                        return {
                            ...accountData,
                            platform: {
                                id: 2,
                                name: 'telegram'
                            },
                            telegramData: {
                                name: `${userData.firstName} ${userData.lastName || ''}`.trim(),
                                username: userData.username,
                                photo: userData.photo
                            }
                        };
                    } catch (error) {
                        logger.error('Error fetching Telegram data:', error);
                        return {
                            ...accountData,
                            platform: {
                                id: 2,
                                name: 'telegram'
                            }
                        };
                    }
                }
                return accountData;
            }));

            res.json(accountsWithData);
        } catch (error) {
            logger.error('Error in getAccounts:', error);
            res.status(500).json({ message: 'Error fetching accounts' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await accountService.deleteAccount(id);
            res.json({ message: 'Account deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getVKData(req, res) {
        try {
            const { id } = req.params;
            const account = await accountService.getVKData(id);
            
            const userInfo = await vkService.getUserInfo(account.access_token);
            
            res.json({
                account,
                vkData: {
                    userInfo
                }
            });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async createVKAccount(req, res) {
        try {
            const { accessToken } = req.body;
            if (!accessToken) {
                return res.status(400).json({ message: 'Access token is required' });
            }

            const userInfo = await vkService.getUserInfo(accessToken);

            const account = await accountService.createAccount({
              userId : req.user.id,
              platformId : 1,
              accountSnId : userInfo.id,
              accessToken : accessToken,
              refreshToken : ''
            });

            res.status(201).json({
                account,
                vkData: {
                    name: `${userInfo.first_name} ${userInfo.last_name}`,
                    photo: userInfo.photo_200
                }
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createTelegramAccount(req, res) {
        try {
            const { apiId, apiHash, session } = req.body;
            const userId = req.user.id;

            if (!apiId || !apiHash || !session) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            // Create new Telegram account
            const account = await accountService.createAccount({
                userId: userId,
                platformId: 2,
                accountSnId: `tg_${userId}_${Date.now()}`,
                accessToken: session,
                refreshToken: JSON.stringify({
                    apiId,
                    apiHash,
                    session // Сохраняем строку сессии
                }),
                type: 'telegram'
            });

            try {
                // Initialize Telegram client to get user info
                const telegramData = await this.telegramService.getTelegramData(
                    apiId,
                    apiHash,
                    session
                );

                // Update account with user info
                account.telegramData = {
                    name: `${telegramData.firstName} ${telegramData.lastName || ''}`.trim(),
                    username: telegramData.username,
                    photo: telegramData.photo
                };

                res.status(201).json({
                    account,
                    telegramData: account.telegramData
                });
            } catch (error) {
                // Если не удалось получить данные, удаляем аккаунт
                await accountService.deleteAccount(account.id);
                throw error;
            }
        } catch (error) {
            console.error('Error creating Telegram account:', error);
            res.status(500).json({ 
                message: error.message,
                details: error.stack
            });
        }
    }

    async getTelegramChannels(req, res) {
        try {
            const account = await accountService.getAccountById(req.params.id);

            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }

            if (account.platform_id !== 2) {
                return res.status(400).json({ error: 'Not a Telegram account' });
            }

            const telegramData = JSON.parse(account.refresh_token);
            if (!telegramData.apiId || !telegramData.apiHash || !telegramData.session) {
                logger.error('Invalid Telegram data:', {
                    accountId: account.id,
                    hasApiId: !!telegramData.apiId,
                    hasApiHash: !!telegramData.apiHash,
                    hasSession: !!telegramData.session
                });
                return res.status(400).json({ error: 'Invalid Telegram session data' });
            }

            logger.debug('Getting channels for account:', {
                accountId: account.id,
                apiId: telegramData.apiId,
                hasApiHash: !!telegramData.apiHash,
                hasSession: !!telegramData.session
            });

            const channels = await this.telegramService.getChannels(
                telegramData.apiId,
                telegramData.apiHash,
                telegramData.session
            );

            res.json(channels);
        } catch (error) {
            logger.error('Error getting Telegram channels:', error);
            res.status(500).json({ 
                error: error.message,
                details: error.stack
            });
        }
    }

    async getVKCommunities(req, res) {
        try {
            const accountId = req.params.id;
            console.log('Getting VK communities for account:', accountId);
            
            const account = await accountService.getAccountById(accountId);
            if (!account) {
                console.log('Account not found');
                return res.status(404).json({ message: 'Account not found' });
            }
            
            if (account.platform_id !== 1) {
                console.log('Not a VK account');
                return res.status(400).json({ message: 'Not a VK account' });
            }

            console.log('Account found, access token:', account.access_token ? '***' : 'undefined');
            if (!account.access_token) {
                return res.status(400).json({ message: 'No access token found' });
            }

            const communities = await this.vkService.getCommunities(account.access_token);
            console.log('Successfully got communities:', communities.length);
            res.json(communities);
        } catch (error) {
            console.error('Error fetching VK communities:', error);
            res.status(500).json({ 
                message: 'Error fetching VK communities',
                error: error.message
            });
        }
    }

    async getPosts(req, res) {
        try {
            console.log('Starting getPosts for user:', req.user.id);
            const accounts = await accountService.getAccounts(req.user.id);
            console.log('Found accounts:', accounts.length);
            let allPosts = [];

            for (const account of accounts) {
                try {
                    console.log('Processing account:', account.id, 'platform:', account.platform_id);
                    if (account.platform_id === 1) { // VK
                        const communities = await this.vkService.getCommunities(account.access_token);
                        console.log('Found VK communities:', communities.length);
                        
                        for (const community of communities) {
                            try {
                                const vkPosts = await this.vkService.getAllPosts(community.id, account.access_token);
                                console.log(`Found ${vkPosts.length} posts for VK community ${community.id}`);
                                const formattedPosts = vkPosts.map(post => ({
                                    id: post.id,
                                    platform: 'vk',
                                    text: post.text,
                                    date: post.date,
                                    likes: post.likes || 0,
                                    reposts: post.reposts || 0,
                                    views: post.views || 0,
                                    comments: post.comments || 0,
                                    forwards: post.forwards || 0,
                                    attachments: post.attachments,
                                    isPinned: post.isPinned,
                                    isAd: post.isAd,
                                    type: 'post',
                                    community: {
                                        id: community.id,
                                        name: community.name,
                                        photo: community.photo,
                                        accountId: account.id
                                    }
                                }));
                                allPosts = allPosts.concat(formattedPosts);
                            } catch (error) {
                                console.error(`Error getting posts for VK community ${community.id}:`, error);
                                continue;
                            }
                        }
                    } else if (account.platform_id === 2) { // Telegram
                        try {
                            console.log('Processing Telegram account:', account.id);
                            const telegramData = JSON.parse(account.refresh_token);
                            if (!telegramData.apiId || !telegramData.apiHash || !telegramData.session) {
                                console.error('Invalid Telegram data:', {
                                    hasApiId: !!telegramData.apiId,
                                    hasApiHash: !!telegramData.apiHash,
                                    hasSession: !!telegramData.session
                                });
                                continue;
                            }

                            console.log('Getting Telegram channels...');
                            const channels = await this.telegramService.getChannels(
                                telegramData.apiId,
                                telegramData.apiHash,
                                telegramData.session
                            );
                            console.log('Found Telegram channels:', channels.length);
                            
                            for (const channel of channels) {
                                try {
                                    console.log('Getting posts for channel:', channel.id);
                                    const tgPosts = await this.telegramService.getPosts(
                                        account.id,
                                        telegramData.apiId,
                                        telegramData.apiHash,
                                        channel.id
                                    );
                                    console.log(`Found ${tgPosts.length} posts for Telegram channel ${channel.id}`);
                                    console.log('Telegram posts:', JSON.stringify(tgPosts, null, 2));
                                    allPosts = allPosts.concat(tgPosts);
                                } catch (error) {
                                    console.error(`Error getting posts for Telegram channel ${channel.id}:`, error);
                                    continue;
                                }
                            }
                        } catch (error) {
                            console.error('Error getting Telegram channels:', error);
                            continue;
                        }
                    }
                } catch (error) {
                    console.error(`Error processing account ${account.id}:`, error);
                    continue;
                }
            }

            console.log('Total posts found:', allPosts.length);
            console.log('Posts by platform:', {
                vk: allPosts.filter(p => p.platform === 'vk').length,
                telegram: allPosts.filter(p => p.platform === 'telegram').length
            });

            // Сортируем посты по дате (новые сверху)
            allPosts.sort((a, b) => b.date - a.date);
            
            res.json({
                posts: allPosts,
                total: allPosts.length
            });
        } catch (error) {
            console.error('Error in getPosts:', error);
            res.status(500).json({ message: 'Error fetching posts' });
        }
    }

    async createPost(req, res) {
        try {
            const { accountId, text, targetId } = req.body;
            const attachments = req.files || [];

            const account = await accountService.getAccountById(accountId);
            if (!account) {
                return res.status(404).json({ message: 'Account not found' });
            }

            let result;
            if (account.platform_id === 1) { // VK
                result = await vkService.createPost(accountId, {
                    text,
                    attachments: attachments.map(file => ({
                        type: file.mimetype.startsWith('image/') ? 'photo' : 'video',
                        file: file.buffer
                    })),
                    communityId: targetId
                });
            } else if (account.platform_id === 2) { // Telegram
                result = await this.telegramService.createPost(req.user.id, targetId, {
                    text,
                    attachments: attachments.map(file => ({
                        type: file.mimetype.startsWith('image/') ? 'photo' : 'video',
                        file: file.buffer
                    }))
                });
            } else {
                return res.status(400).json({ message: 'Unsupported platform' });
            }

            res.status(201).json({
                message: 'Post created successfully',
                postId: result.id
            });
        } catch (error) {
            console.error('Error in createPost:', error);
            res.status(500).json({ 
                message: 'Failed to create post',
                error: error.message 
            });
        }
    }

    async deletePost(req, res) {
        try {
            const { platform, accountId, communityId, channelId, postId } = req.body;

            if (!platform || !postId) {
                return res.status(400).json({ message: 'Missing required parameters' });
            }

            if (platform === 'vk') {
                if (!accountId || !communityId) {
                    return res.status(400).json({ message: 'Missing VK parameters' });
                }
                await vkService.deletePost(accountId, communityId, postId);
            } else if (platform === 'tg') {
                if (!channelId) {
                    return res.status(400).json({ message: 'Missing Telegram channel ID' });
                }
                await this.telegramService.deletePost(req.user.id, channelId, postId);
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json({ 
                message: error.message || 'Failed to delete post',
                error: error.message 
            });
        }
    }
}

module.exports = new AccountController();
