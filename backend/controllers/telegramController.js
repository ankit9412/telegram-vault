const TelegramService = require('../services/telegramService');
const Config = require('../models/Config');

// In-memory store for login sessions during the auth flow
const authFlows = new Map();

exports.checkStatus = async (req, res) => {
    try {
        const telegramService = new TelegramService();
        await telegramService.init();
        const connected = await telegramService.isConnected();
        res.json({ connected });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.sendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required' });

        const telegramService = new TelegramService();
        const phoneCodeHash = await telegramService.sendCode(phoneNumber);

        // Store in memory temporarily
        authFlows.set('global_setup', {
            phoneNumber,
            phoneCodeHash,
            telegramService
        });

        res.json({ message: 'OTP sent successfully', phoneCodeHash });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { phoneCode } = req.body;
        const flow = authFlows.get('global_setup');

        if (!flow) return res.status(400).json({ message: 'No auth flow found. Request OTP first.' });

        try {
            await flow.telegramService.signIn(flow.phoneNumber, flow.phoneCodeHash, phoneCode);
            authFlows.delete('global_setup');
            res.json({ message: 'Telegram connected successfully' });
        } catch (error) {
            if (error.message && error.message.includes('SESSION_PASSWORD_NEEDED')) {
                return res.json({ requires2FA: true, message: '2FA password required' });
            }
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verify2fa = async (req, res) => {
    try {
        const { password } = req.body;
        const flow = authFlows.get('global_setup');

        if (!flow) return res.status(400).json({ message: 'No auth flow found.' });

        await flow.telegramService.checkPassword(password);
        authFlows.delete('global_setup');

        res.json({ message: 'Telegram connected successfully via 2FA' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
