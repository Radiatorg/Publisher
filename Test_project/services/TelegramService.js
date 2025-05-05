const TelegramBot = require('node-telegram-bot-api');
const db = require("../models");
const TelegramChannel = db.TelegramChannel;
const accountService = require('./AccountService');
const bot_token = '7631112537:AAHGpSSlQ28F8yISHT65reS2Uutm7W-iwSQ';

class TelegramService {
    bot = null;

    constructor() {
        this.initializeBot();
    }

    initializeBot() {
        if (!this.bot) {
            this.bot = new TelegramBot(bot_token, { 
                polling: false // Отключаем поллинг, так как будем использовать вебхуки
            });
            this.setupBotHandlers();
        }
    }

    setupBotHandlers() {
        // Обработчик команды /start
        this.bot.onText(/\/start/, async (msg) => {
            try {
                const userId = msg.from.id;
                
                // Проверяем, существует ли уже аккаунт с таким ID
                const existingAccount = await accountService.getAccountBySnId(userId.toString());
                if (existingAccount) {
                    await this.bot.sendMessage(userId, 
                        'Ваш аккаунт уже подключен к системе. ' +
                        'Теперь вы можете использовать все функции бота.'
                    );
                    return;
                }

                // Отправляем сообщение с ID пользователя
                await this.bot.sendMessage(userId, 
                    'Ваш Telegram ID: ' + userId + '\n\n' +
                    'Скопируйте этот ID и вставьте его в форму на сайте для подключения аккаунта.'
                );

            } catch (error) {
                console.error('Error in /start command:', error);
                try {
                    await this.bot.sendMessage(msg.chat.id, 
                        'Произошла ошибка. Пожалуйста, попробуйте позже.'
                    );
                } catch (sendError) {
                    console.error('Error sending error message:', sendError);
                }
            }
        });

        // Обработчик изменения статуса бота в чате/канале
        this.bot.on('my_chat_member', async (msg) => {
            try {
                const chat = msg.chat;
                const newStatus = msg.new_chat_member.status;
                const fromUser = msg.from;

                if (newStatus === 'administrator' || newStatus === 'creator') {
                    console.log(`Бот стал админом в: ${chat.title} (ID: ${chat.id})`);
                    
                    const userAccount = await accountService.getAccountBySnId(fromUser.id.toString());
                    if (!userAccount) {
                        console.error('User account not found');
                        return;
                    }
                    
                    await TelegramChannel.upsert({
                        channelId: chat.id.toString(),
                        title: chat.title || chat.username,
                        username: chat.username,
                        type: chat.type,
                        photo: chat.photo ? 
                            `https://api.telegram.org/file/bot${bot_token}/${chat.photo.big_file_id}` : 
                            null,
                        isActive: true,
                        account_id: userAccount.id
                    });
                } else if (newStatus === 'left' || newStatus === 'kicked') {
                    console.log(`Бот больше не админ в: ${chat.title}`);
                    
                    await TelegramChannel.update(
                        { isActive: false },
                        { where: { channelId: chat.id.toString() } }
                    );
                }
            } catch (error) {
                console.error('Error handling my_chat_member:', error);
            }
        });

        // Обработчик новых сообщений в канале
        this.bot.on('channel_post', async (msg) => {
            try {
                const channelId = msg.chat.id.toString();
                
                // Проверяем, является ли канал активным
                const channel = await TelegramChannel.findOne({
                    where: { channelId, isActive: true }
                });

                if (!channel) {
                    return; // Игнорируем сообщения из неактивных каналов
                }

                // Сохраняем сообщение в базу данных
                await db.TelegramMessage.upsert({
                    messageId: msg.message_id.toString(),
                    channelId: channelId,
                    text: msg.text || msg.caption || '',
                    date: new Date(msg.date * 1000),
                    type: msg.photo ? 'photo' : 
                          msg.video ? 'video' : 
                          msg.document ? 'document' : 
                          msg.audio ? 'audio' : 'text',
                    media: msg.photo ? msg.photo.map(p => p.file_id) :
                           msg.video ? [msg.video.file_id] :
                           msg.document ? [msg.document.file_id] :
                           msg.audio ? [msg.audio.file_id] : [],
                    views: msg.views || 0,
                    forwards: msg.forward_date ? 1 : 0,
                    isPinned: msg.pinned_message ? true : false
                });
            } catch (error) {
                console.error('Error handling channel post:', error);
            }
        });
    }

    async getUserAdminChannels(userId) {
        try {
            const numericUserId = parseInt(userId, 10);
            if (isNaN(numericUserId)) {
                throw new Error('Invalid user ID format');
            }

            const userAccount = await accountService.getAccountBySnId(userId.toString());
            if (!userAccount) {
                throw new Error('Account not found');
            }

            const channels = await TelegramChannel.findAll({
                where: { isActive: true },
                include: [{
                    model: db.Account,
                    as: 'account',
                    where: { id: userAccount.id }
                }]
            });

            return channels.map(channel => ({
                id: channel.channelId,
                name: channel.title,
                type: channel.type,
                photo: channel.photo
            }));
        } catch (error) {
            console.error('Error in getUserAdminChannels:', error);
            throw new Error('Failed to get user admin channels');
        }
    }

    async getAllPosts(channelId, limit = 100) {
        try {
            console.log('Getting all posts for channel:', channelId);
            
            // Проверяем, существует ли канал
            const channel = await TelegramChannel.findOne({
                where: { channelId: channelId.toString() }
            });

            if (!channel) {
                console.log('Channel not found:', channelId);
                return [];
            }
            console.log(channelId.toString());
            const messages = await db.TelegramMessage.findAll({
                where: { 
                    channelId: channelId.toString(),
                    isActive: true
                },
            //     ,
            //     order: [['date', 'DESC']],
            //     limit: limit,
                include: [{
                    model: TelegramChannel,
                    as: 'channel',
                }]
            }
        );

            console.log(`Found ${messages.length} messages`);
            messages.map(m => console.log(m.channelId))
            return messages.map(message => {
                const post = {
                    id: message.messageId,
                    platform: 'tg',
                    text: message.text || '',
                    date: Math.floor(message.date.getTime() / 1000),
                    channelId: message.channelId,
                    type: message.type || 'text',
                    media: message.media || [],
                    views: message.views || 0,
                    forwards: message.forwards || 0,
                    likes: 0, // Telegram не поддерживает лайки
                    reposts: 0, // Telegram не поддерживает репосты
                    comments: 0, // Telegram не поддерживает комментарии
                    isPinned: message.isPinned || false,
                    community: {
                        id: channel.channelId,
                        name: channel.title,
                        photo: channel.photo,
                        type: channel.type
                    }
                };

                console.log('Processed post:', {
                    id: post.id,
                    type: post.type,
                    mediaCount: post.media.length,
                    textLength: post.text.length
                });

                return post;
            });
        } catch (error) {
            console.error('Error getting all posts:', {
                error: error.message,
                stack: error.stack,
                channelId
            });
            throw error;
        }
    }

    async setupWebhook(webhookUrl) {
        try {
            await this.bot.setWebHook(webhookUrl);
            console.log('Webhook set up successfully');
            return true;
        } catch (error) {
            console.error('Error setting up webhook:', error);
            throw new Error('Failed to set up webhook');
        }
    }

    async getWebhookInfo() {
        try {
            const info = await this.bot.getWebHookInfo();
            return info;
        } catch (error) {
            console.error('Error getting webhook info:', error);
            throw new Error('Failed to get webhook info');
        }
    }

    async getTelegramData(UserToken) {
        try {
            const chat = await this.getChat(UserToken);
            
            return {
                name: chat.first_name + (chat.last_name ? ` ${chat.last_name}` : ''),
                photo: chat.photo?.big_file_id ? 
                    await this.bot.getFileLink(chat.photo.big_file_id) : 
                    'https://t.me/i/userpic/320/raider907.jpg'
            };
        } catch (error) {
            console.error('Error getting Telegram data:', error);
            throw new Error('Failed to get Telegram user data');
        }
    }

    async getChat(userId) {
        try {
            const chat = await this.bot.getChat(userId);
            
            // Получаем фото профиля, если оно есть
            let photoUrl = null;
            if (chat.photo) {
                const file = await this.bot.getFile(chat.photo.big_file_id);
                photoUrl = `https://api.telegram.org/file/bot${bot_token}/${file.file_path}`;
            }

            return {
                id: chat.id,
                first_name: chat.first_name,
                last_name: chat.last_name,
                username: chat.username,
                photo: photoUrl,
                type: chat.type
            };
        } catch (error) {
            console.error('Error getting chat info:', error);
            throw new Error('Failed to get chat information');
        }
    }
    

    async getAdminChannels() {
        try {
            const chatMember = await this.bot.getChatMember('@channel_username', this.bot.options.username);
            if (chatMember.status === 'administrator') {
                return chatMember.chat;
            }
            return null;
        } catch (error) {
            console.error('Error getting admin channels:', error);
            throw error;
        }
    }

    // Get all comments for a post
    async getAllComments(channelId, postMessageId) {
        try {
            const comments = [];
            let lastMessageId = null;
            
            while (true) {
                const options = {
                    chat_id: channelId,
                    limit: 100
                };
                
                if (lastMessageId) {
                    options.offset_id = lastMessageId;
                }
                
                const updates = await this.bot.getUpdates(options);
                
                if (!updates || updates.length === 0) {
                    break;
                }
                
                for (const update of updates) {
                    if (update.message && 
                        update.message.reply_to_message && 
                        update.message.reply_to_message.message_id === postMessageId) {
                        comments.push({
                            messageId: update.message.message_id,
                            text: update.message.text,
                            date: update.message.date,
                            channelId: channelId,
                            postMessageId: postMessageId
                        });
                    }
                }
                
                lastMessageId = updates[updates.length - 1].update_id;
                
                if (updates.length < 100) {
                    break;
                }
            }
            
            return comments;
        } catch (error) {
            console.error('Error getting all comments:', error);
            throw error;
        }
    }

    // Create a post in a channel
    async createPost(accountId, postData) {
        let messageId;
        try {
            console.log('Starting createPost with data:', {
                accountId,
                channelId: postData.channelId,
                textLength: postData.text?.length || 0,
                attachmentsCount: postData.attachments?.length || 0
            });

            const account = await db.Account.findByPk(accountId);
            if (!account) {
                throw new Error('Account not found');
            }

            // Проверяем существование канала
            const channel = await TelegramChannel.findOne({
                where: { channelId: postData.channelId.toString() }
            });

            if (!channel) {
                throw new Error('Channel not found');
            }

            console.log('Found channel:', {
                channelId: channel.channelId,
                title: channel.title,
                isActive: channel.isActive
            });

            const { text, attachments = [], channelId } = postData;
            
            // Ограничиваем длину текста
            const maxTextLength = 4000;
            const truncatedText = text ? text.slice(0, maxTextLength) : '';
            console.log('Text processing:', {
                originalLength: text?.length || 0,
                truncatedLength: truncatedText.length
            });
            
            // Ограничиваем количество вложений
            const maxAttachments = 10;
            const limitedAttachments = attachments.slice(0, maxAttachments);
            console.log('Attachments processing:', {
                originalCount: attachments.length,
                limitedCount: limitedAttachments.length
            });

            let result;
            try {
                if (limitedAttachments.length > 0) {
                    console.log('Attempting to send attachments one by one...');
                    
                    // Отправляем первое сообщение с текстом и первым вложением
                    const firstAttachment = limitedAttachments[0];
                    const fileBuffer = Buffer.from(firstAttachment.file);
                    
                    if (firstAttachment.type === 'photo') {
                        result = await this.bot.sendPhoto(channelId, fileBuffer, {
                            caption: truncatedText,
                            parse_mode: 'HTML'
                        });
                    } else if (firstAttachment.type === 'video') {
                        result = await this.bot.sendVideo(channelId, fileBuffer, {
                            caption: truncatedText,
                            parse_mode: 'HTML'
                        });
                    }
                    
                    console.log('First attachment sent successfully');
                    messageId = result.message_id;

                    // Отправляем остальные вложения без текста
                    for (let i = 1; i < limitedAttachments.length; i++) {
                        const attachment = limitedAttachments[i];
                        const fileBuffer = Buffer.from(attachment.file);
                        
                        if (attachment.type === 'photo') {
                            await this.bot.sendPhoto(channelId, fileBuffer);
                        } else if (attachment.type === 'video') {
                            await this.bot.sendVideo(channelId, fileBuffer);
                        }
                        
                        console.log(`Attachment ${i + 1} sent successfully`);
                    }
                } else if (truncatedText) {
                    console.log('Attempting to send text message...');
                    result = await this.bot.sendMessage(channelId, truncatedText, {
                        parse_mode: 'HTML',
                        disable_web_page_preview: true
                    });
                    console.log('Text message sent successfully');
                    messageId = result.message_id;
                } else {
                    throw new Error('No content to post');
                }
            } catch (error) {
                console.error('Error during message sending:', {
                    error: error.message,
                    stack: error.stack,
                    attachmentsCount: limitedAttachments.length,
                    textLength: truncatedText.length
                });
                throw error;
            }

            // Сохраняем сообщение в базу данных сразу после отправки
            try {
                console.log('Saving message to database:', {
                    messageId,
                    channelId,
                    type: limitedAttachments.length > 0 ? (limitedAttachments[0].type === 'photo' ? 'photo' : 'video') : 'text',
                    textLength: truncatedText.length,
                    mediaCount: limitedAttachments.length
                });

                const savedMessage = await db.TelegramMessage.upsert({
                    messageId: messageId.toString(),
                    channelId: channelId.toString(),
                    text: truncatedText,
                    date: new Date(),
                    type: limitedAttachments.length > 0 ? (limitedAttachments[0].type === 'photo' ? 'photo' : 'video') : 'text',
                    media: limitedAttachments.map(a => a.file),
                    views: 0,
                    forwards: 0,
                    isPinned: false,
                    isActive: true
                });

                console.log('Message saved to database successfully:', {
                    messageId: savedMessage[0].messageId,
                    channelId: savedMessage[0].channelId,
                    isActive: savedMessage[0].isActive
                });
            } catch (error) {
                console.error('Error saving message to database:', error);
                throw error;
            }

            return {
                id: messageId,
                success: true
            };
        } catch (error) {
            console.error('Error in createPost:', {
                error: error.message,
                stack: error.stack,
                accountId,
                channelId: postData.channelId,
                messageId
            });
            throw new Error(`Failed to create Telegram post: ${error.message}`);
        }
    }

    // Edit a post in a channel
    async editPost(channelId, messageId, newText, options = {}) {
        try {
            const message = await this.bot.editMessageText(newText, {
                chat_id: channelId,
                message_id: messageId,
                parse_mode: 'HTML',
                ...options
            });
            return message;
        } catch (error) {
            console.error('Error editing post:', error);
            throw error;
        }
    }

    // Delete a post from a channel
    async deletePost(channelId, messageId) {
        try {
            await this.bot.deleteMessage(channelId, messageId);
            return true;
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    }

    // Delete a comment
    async deleteComment(channelId, messageId) {
        try {
            await this.bot.deleteMessage(channelId, messageId);
            return true;
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    }

    // Create a comment
    async createComment(channelId, messageId, text, options = {}) {
        try {
            const message = await this.bot.sendMessage(channelId, text, {
                reply_to_message_id: messageId,
                parse_mode: 'HTML',
                ...options
            });
            return message;
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    }

    // Edit a comment
    async editComment(channelId, messageId, newText, options = {}) {
        try {
            const message = await this.bot.editMessageText(newText, {
                chat_id: channelId,
                message_id: messageId,
                parse_mode: 'HTML',
                ...options
            });
            return message;
        } catch (error) {
            console.error('Error editing comment:', error);
            throw error;
        }
    }

    // Send message to user about adding bot to channel
    async sendAddBotMessage(userId, botUsername) {
        try {
            const message = `Для добавления бота в ваш канал, выполните следующие шаги:\n\n` +
                `1. Добавьте @${botUsername} в администраторы вашего канала\n` +
                `2. Предоставьте боту права на публикацию сообщений\n` +
                `3. После этого бот сможет управлять постами в вашем канале`;
            
            await this.bot.sendMessage(userId, message);
            return true;
        } catch (error) {
            console.error('Error sending add bot message:', error);
            throw error;
        }
    }
}

module.exports = TelegramService; 
