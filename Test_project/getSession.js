const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input'); // npm i input

// Замените эти значения на те, которые вы получили с my.telegram.org
const apiId = 123456; // Ваш api_id
const apiHash = 'your_api_hash_here'; // Ваш api_hash

(async () => {
    console.log('Loading interactive example...');
    const stringSession = new StringSession(''); // Заполните это, если у вас уже есть сессия

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text('Please enter your phone number: '),
        password: async () => await input.text('Please enter your password: '),
        phoneCode: async () => await input.text('Please enter the code you received: '),
        onError: (err) => console.log(err),
    });

    console.log('You should now be connected.');
    console.log('Session string:', client.session.save());
    await client.disconnect();
})(); 