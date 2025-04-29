// controllers/accountController.js
const accountService = require('../services/AccountService');
const vkService = require('../services/VKService');
const catchAsync = require('../utils/catchAsync');

class AccountController {
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

            const accountsWithVKData = await Promise.all(accounts.map(async (account) => {
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
                        console.error(`Error fetching VK data for account ${account.id}:`, error);
                        return account;
                    }
                }
                return account;
            }));

            res.json(accountsWithVKData);
        } catch (error) {
            res.status(500).json({ message: error.message });
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
}

module.exports = new AccountController();
