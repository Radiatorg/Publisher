const db = require("../models");
const Account = db.Account;


    async function createAccount(data) {

        return await Account.create({
            user_id: data.userId,
            platform_id: data.platformId,
            account_sn_id: data.accountSnId,
            access_token: data.accessToken,
            refresh_token: data.refreshToken
        });
    }

    async function getAccountById(id) {
        return await Account.findByPk(id, {
            include: ['user', 'platform']
        });
    }

    async function getAccounts(userId) {
        return await Account.findAll({
            where: { user_id: userId }
        });
    }

    async function getUserAccounts(userId) {
        return await Account.findAll({
            where: { user_id: userId },
            include: ['user', 'platform']
        });
    }

    async function updateAccount(id, data) {
        const account = await Account.findByPk(id);
        if (!account) {
            throw new Error('Account not found');
        }

        return await account.update({
            access_token: data.accessToken,
            refresh_token: data.refreshToken
        });
    }

    async function deleteAccount(id) {
        const account = await Account.findByPk(id);
        if (!account) {
            throw new Error('Account not found');
        }

        await account.destroy();
        return true;
    }

    async function getAccountBySnId(accountSnId) {
        return await Account.findOne({
            where: { account_sn_id: accountSnId },
            include: ['user', 'platform']
        });
    }

    module.exports = {
        createAccount,
        getAccountById,
        getAccounts,
        getUserAccounts,
        updateAccount,
        deleteAccount,
        getAccountBySnId
    };