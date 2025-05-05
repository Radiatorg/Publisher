// controllers/accountController.js
const accountService = require('../services/AccountService');
const vkService = require('../services/VKService');
const TelegramService = require('../services/TelegramService');
const catchAsync = require('../utils/catchAsync');

class AccountController {
    telegramService = null
    constructor(){
        this.telegramService = new TelegramService();
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
                if (account.platform_id === 1) {
                    try {
                      const userInfo = await vkService.getUserInfo(account.access_token);
                      return {
                          ...account.toJSON(),
                          vkData: {
                              name: `${userInfo.first_name} ${userInfo.last_name}`,
                              photo: userInfo.photo_200
                          }
                      };
                    } catch (error) {
                        console.error('Error fetching VK data:', error);
                    }
                } else if (account.platform_id === 2) {
                    try {
                        const telegramData = await this.telegramService.getTelegramData(account.access_token);
                        
                        accountData.telegramData = telegramData;
                    } catch (error) {
                        console.error('Error fetching Telegram data:', error);
                    }
                }
                
                return accountData;
            }));

            res.json(accountsWithData);
        } catch (error) {
            console.error('Error in getAccounts:', error);
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
              const { telegram_id } = req.body;
              if (!telegram_id) {
                  return res.status(400).json({ message: 'Telegram ID is required' });
              }

            if (isNaN(telegram_id)) {
                return res.status(400).json({ 
                    message: 'Invalid Telegram ID format. Please enter a numeric ID.',
                    help: 'You can get your Telegram ID by sending /start to the bot'
                });
            }

            try {
                // Проверяем, может ли бот получить информацию о пользователе
                const chat = await this.telegramService.bot.getChat(telegram_id);
                
                // Проверяем, что это личный чат с пользователем
                if (chat.type !== 'private') {
                    return res.status(400).json({ 
                        message: 'Invalid chat type. Please provide your personal Telegram ID.',
                        help: 'You can get your Telegram ID by sending /start to the bot'
                    });
                }

                // Проверяем, существует ли уже аккаунт с таким ID
                const existingAccount = await accountService.getAccountBySnId(telegram_id);
                if (existingAccount) {
                    return res.status(400).json({
                        message: 'This Telegram account is already connected to the system'
                    });
                }

                // Создаем запись в базе данных
                const account = await accountService.createAccount({
                    userId: req.user.id,
                    platformId: 2,
                    accountSnId: telegram_id,
                    accessToken: telegram_id,
                    refreshToken: ''
                });

                // Отправляем сообщение пользователю в Telegram
                await this.telegramService.bot.sendMessage(telegram_id, 
                    'Ваш Telegram аккаунт успешно подключен к системе! ' +
                    'Теперь вы можете использовать все функции бота.'
                );

                res.status(201).json({
                    account,
                    message: 'Telegram account added successfully'
                });
            } catch (error) {
                if (error.message.includes('chat not found')) {
                    return res.status(400).json({
                        message: 'Cannot access Telegram account. Please make sure:',
                        help: [
                            '1. You have sent /start to the bot',
                            '2. You have not blocked the bot',
                            '3. You are using the correct Telegram ID (get it by sending /start to the bot)'
                        ]
                    });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error creating Telegram account:', error);
            res.status(500).json({ 
                message: 'Failed to create Telegram account',
                error: error.message 
            });
        }
    }

    async getPosts(req, res) {
        try {
            // Получаем все аккаунты пользователя
            const accounts = await accountService.getAccounts(req.user.id);
            let allPosts = [];

            // Для каждого аккаунта получаем посты
            for (const account of accounts) {
                try {
                    if (account.platform_id === 1) { // VK
                        // Получаем список сообществ пользователя
                        const communities = await vkService.getUserAdminCommunities(account.access_token);
                        
                        // Для каждого сообщества получаем посты
                        for (const community of communities) {
                            const vkPosts = await vkService.getAllPosts(community.id, account.access_token);
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
                                    photo: community.photo
                                }
                            }));
                            allPosts = allPosts.concat(formattedPosts);
                        }
                    } 
                    else if (account.platform_id === 2) { // Telegram
                        // Получаем список каналов пользователя
                        const numericId = parseInt(account.account_sn_id, 10);
                        if (isNaN(numericId)) {
                            console.error(`Invalid Telegram ID format: ${account.account_sn_id}`);
                            continue;
                        }
                        const channels = await this.telegramService.getUserAdminChannels(numericId);
                        
                        // Для каждого канала получаем посты
                        for (const channel of channels) {
                            const tgPosts = await this.telegramService.getAllPosts(channel.id);
                            const formattedPosts = tgPosts.map(post => ({
                                id: post.messageId,
                                platform: 'tg',
                                text: post.text || '',
                                date: post.date,
                                likes: 0,
                                reposts: 0,
                                views: post.views || 0,
                                comments: 0,
                                forwards: post.forwards || 0,
                                attachments: post.media ? post.media.map(url => ({
                                    type: 'photo',
                                    url: url
                                })) : [],
                                isPinned: false,
                                isAd: false,
                                type: post.type || 'post',
                                community: {
                                    id: channel.id,
                                    name: channel.name,
                                    photo: channel.photo
                                }
                            }));
                            allPosts = allPosts.concat(formattedPosts);
                        }
                    }
                } catch (error) {
                    console.error(`Error getting posts for account ${account.id}:`, error);
                    // Продолжаем с следующим аккаунтом даже если произошла ошибка
                    continue;
                }
            }

            // Сортируем все посты по дате (от новых к старым)
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
            console.log(account)
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
                result = await this.telegramService.createPost(accountId, {
                    text,
                    attachments: attachments.map(file => ({
                        type: file.mimetype.startsWith('image/') ? 'photo' : 'video',
                        file: file.buffer
                    })),
                    channelId: targetId
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

    async getTelegramChannels(req, res) {
        try {
            const { id } = req.params;
            const account = await accountService.getAccountById(id);
            
            if (!account) {
                return res.status(404).json({ message: 'Account not found' });
            }

            if (account.platform_id !== 2) {
                return res.status(400).json({ message: 'This is not a Telegram account' });
            }

            const channels = await this.telegramService.getUserAdminChannels(account.account_sn_id);
            res.json(channels);
        } catch (error) {
            console.error('Error getting Telegram channels:', error);
            res.status(500).json({ message: 'Failed to get Telegram channels' });
        }
    }

    async getVKCommunities(req, res) {
        try {
            const { id } = req.params;
            const account = await accountService.getAccountById(id);
            
            if (!account) {
                return res.status(404).json({ message: 'Account not found' });
            }

            if (account.platform_id !== 1) {
                return res.status(400).json({ message: 'This is not a VK account' });
            }

            const communities = await vkService.getUserAdminCommunities(account.access_token);
            res.json(communities);
        } catch (error) {
            console.error('Error getting VK communities:', error);
            res.status(500).json({ message: 'Failed to get VK communities' });
        }
    }
}

module.exports = new AccountController();
