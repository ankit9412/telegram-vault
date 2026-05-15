const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { Api } = require('telegram/tl');
const { CustomFile } = require('telegram/client/uploads');
const Config = require('../models/Config');

class TelegramService {
    constructor() {
        this.apiId = parseInt(process.env.API_ID);
        this.apiHash = process.env.API_HASH;
        this.client = null;
    }

    async init() {
        let sessionString = '';
        try {
            const config = await Config.findOne({ key: 'global_session' });
            sessionString = config ? config.value : '';
        } catch (e) {
            console.error('TelegramService: DB session read failed:', e.message);
        }

        if (!sessionString) {
            this.client = null;
            return;
        }

        const stringSession = new StringSession(sessionString);
        this.client = new TelegramClient(stringSession, this.apiId, this.apiHash, {
            connectionRetries: 5,
        });

        try {
            await this.client.connect();
        } catch (e) {
            console.error('TelegramService: failed to connect with saved session:', e.message);
            this.client = null;
        }
    }

    async isConnected() {
        if (!this.client) return false;
        try {
            await this.client.getMe();
            return true;
        } catch (e) {
            return false;
        }
    }

    async saveSession() {
        const sessionString = this.client.session.save();
        await Config.findOneAndUpdate(
            { key: 'global_session' },
            { value: sessionString },
            { upsert: true }
        );
        return sessionString;
    }

    async sendCode(phoneNumber) {
        await this.init();
        if (!this.client) {
            const stringSession = new StringSession('');
            this.client = new TelegramClient(stringSession, this.apiId, this.apiHash, {
                connectionRetries: 5,
            });
        }
        await this.client.connect();
        const { phoneCodeHash } = await this.client.sendCode(
            { apiId: this.apiId, apiHash: this.apiHash },
            phoneNumber
        );
        return phoneCodeHash;
    }

    async signIn(phoneNumber, phoneCodeHash, phoneCode) {
        await this.client.invoke(
            new Api.auth.SignIn({ phoneNumber, phoneCodeHash, phoneCode })
        );
        return await this.saveSession();
    }

    async checkPassword(password) {
        await this.client.signInWithPassword({
            apiId: this.apiId,
            apiHash: this.apiHash,
        }, {
            password,
            onError: (err) => { throw err; }
        });
        return await this.saveSession();
    }

    async uploadFile(buffer, fileName) {
        const uploadedFile = await this.client.uploadFile({
            file: new CustomFile(fileName, buffer.length, '', buffer),
            workers: 1,
        });
        const result = await this.client.sendFile('me', {
            file: uploadedFile,
            forceDocument: true,
            caption: fileName
        });
        return result.id;
    }

    async downloadFile(messageId) {
        const messages = await this.client.getMessages('me', { ids: [messageId] });
        if (messages.length === 0) throw new Error('Message not found');
        return await this.client.downloadMedia(messages[0]);
    }

    async deleteMessage(messageId) {
        await this.client.deleteMessages('me', [messageId], { revoke: true });
    }

    async disconnect() {
        if (this.client) await this.client.disconnect();
    }
}

module.exports = TelegramService;
