const { VK } = require('vk-io');
const db = require("../models");

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
}

module.exports = new VKService(); 