const express = require('express');
const router = express.Router();
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { NewMessage } = require('telegram/events');
const { Api } = require('telegram/tl');

// In-memory storage for auth sessions
const authSessions = new Map();

// Start authentication process
router.post('/start-auth', async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        const { apiId, apiHash, phoneNumber } = req.body;

        if (!apiId || !apiHash || !phoneNumber) {
            console.log('Missing fields:', { apiId, apiHash, phoneNumber });
            return res.status(400).json({ 
                message: 'Missing required fields',
                received: { apiId, apiHash, phoneNumber }
            });
        }

        // Убираем пробелы из apiHash
        const trimmedApiHash = apiHash.trim();

        console.log('Creating Telegram client with:', { apiId, apiHash: trimmedApiHash });
        
        // Create a new client
        const client = new TelegramClient(
            new StringSession(''), // empty string = new session
            parseInt(apiId),
            trimmedApiHash,
            {
                connectionRetries: 5,
                useWSS: true,
                deviceModel: 'Desktop',
                systemVersion: 'Windows',
                appVersion: '1.0.0',
                langCode: 'en',
                timeout: 30000 // 30 секунд таймаут
            }
        );

        console.log('Connecting to Telegram...');
        await client.connect();
        
        console.log('Sending code request for:', phoneNumber);

        // Create the auth.sendCode request
        const result = await client.invoke(new Api.auth.SendCode({
            phoneNumber: phoneNumber,
            apiId: parseInt(apiId),
            apiHash: trimmedApiHash,
            settings: new Api.CodeSettings({
                allowFlashcall: false,
                currentNumber: false,
                allowAppHash: false,
                allowMissedCall: false,
                allowSms: true,
                logoutTokens: [],
                token: undefined
            })
        }));

        console.log('Code sent successfully, storing session...');
        // Store the session data
        const sessionKey = `${phoneNumber}_${apiId}`;
        authSessions.set(sessionKey, {
            phoneCodeHash: result.phoneCodeHash,
            apiId,
            apiHash: trimmedApiHash,
            phoneNumber,
            client
        });

        console.log('Session stored with key:', sessionKey);
        res.json({ success: true, sessionKey });
    } catch (error) {
        console.error('Detailed error in start-auth:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ 
            message: error.message,
            details: error.stack
        });
    }
});

// Verify code and get session
router.post('/verify-code', async (req, res) => {
    try {
        const { apiId, apiHash, phoneNumber, code } = req.body;

        if (!apiId || !apiHash || !phoneNumber || !code) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const sessionKey = `${phoneNumber}_${apiId}`;
        console.log('Looking for session with key:', sessionKey);

        const session = authSessions.get(sessionKey);
        if (!session) {
            return res.status(400).json({ message: 'No active authentication session found' });
        }

        console.log('Found session:', session);

        try {
            // Use invoke with SignIn method
            const result = await session.client.invoke(new Api.auth.SignIn({
                phoneNumber: phoneNumber,
                phoneCodeHash: session.phoneCodeHash,
                phoneCode: code
            }));

            // Check if 2FA is required
            if (result instanceof Api.auth.AuthorizationSignUpRequired) {
                return res.json({ requiresPassword: true });
            }

            const sessionString = session.client.session.save();
            authSessions.delete(sessionKey);
            await session.client.disconnect();

            res.json({ session: sessionString });
        } catch (error) {
            if (error.message.includes('PASSWORD_REQUIRED')) {
                return res.json({ requiresPassword: true });
            }
            throw error;
        }
    } catch (error) {
        console.error('Error verifying Telegram code:', error);
        res.status(500).json({ message: error.message });
    }
});

// Submit 2FA password
router.post('/submit-password', async (req, res) => {
    try {
        const { apiId, apiHash, phoneNumber, password } = req.body;

        if (!apiId || !apiHash || !phoneNumber || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const sessionKey = `${phoneNumber}_${apiId}`;
        const session = authSessions.get(sessionKey);
        if (!session) {
            return res.status(400).json({ message: 'No active authentication session found' });
        }

        try {
            await session.client.signIn({
            password
        });
        } catch (error) {
            throw new Error('Invalid password');
        }

        const sessionString = session.client.session.save();
        authSessions.delete(sessionKey);
        await session.client.disconnect();

        res.json({ session: sessionString });
    } catch (error) {
        console.error('Error submitting Telegram password:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 