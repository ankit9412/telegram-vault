const VaultItem = require('../models/VaultItem');
const TelegramService = require('../services/telegramService');
const encryption = require('../utils/encryption');

// MIME types that can be previewed inline in the browser
const INLINE_MIME_TYPES = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
    'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/flac',
    'video/mp4', 'video/webm', 'video/ogg',
    'application/pdf',
    'text/plain',
]);

exports.uploadItem = async (req, res) => {
    try {
        const { title, type, noteContent } = req.body;

        const telegramService = new TelegramService();
        await telegramService.init();

        if (!await telegramService.isConnected()) {
            return res.status(500).json({ message: 'Server is missing global Telegram session' });
        }

        let dataBuffer;
        let originalSize = 0;
        let mimeType = 'text/plain';
        let originalName = 'note.txt';

        if (type === 'file') {
            if (!req.file) return res.status(400).json({ message: 'No file provided' });
            dataBuffer = req.file.buffer;
            originalSize = req.file.size;
            mimeType = req.file.mimetype;
            originalName = req.file.originalname;
        } else if (type === 'note') {
            if (!noteContent) return res.status(400).json({ message: 'Note content is required' });
            dataBuffer = Buffer.from(noteContent, 'utf-8');
            originalSize = dataBuffer.length;
        } else {
            return res.status(400).json({ message: 'Invalid type' });
        }

        // Encrypt the file/note data
        const { iv, encryptedData, tag } = encryption.encrypt(dataBuffer);

        // Encrypt metadata
        const metadataToEncrypt = JSON.stringify({ originalName, mimeType, tag });
        const encryptedMeta = encryption.encryptMetadata(metadataToEncrypt);

        // Upload to Telegram
        const messageId = await telegramService.uploadFile(encryptedData, `vault_${Date.now()}.enc`);

        // Save to DB (store mimeType in plaintext for quick access)
        const item = await VaultItem.create({
            userId: req.user.id,
            title,
            type,
            mimeType,
            telegramMessageId: messageId,
            encryptedMetadata: encryptedMeta.encryptedData,
            iv: iv + ':' + encryptedMeta.iv + ':' + encryptedMeta.tag,
            size: originalSize
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getItems = async (req, res) => {
    try {
        const items = await VaultItem.find({ userId: req.user.id }).sort('-createdAt');
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getItem = async (req, res) => {
    try {
        const item = await VaultItem.findOne({ _id: req.params.id, userId: req.user.id });
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const telegramService = new TelegramService();
        await telegramService.init();

        // Download from Telegram
        const encryptedData = await telegramService.downloadFile(item.telegramMessageId);

        // Parse IVs
        const [dataIv, metaIv, metaTag] = item.iv.split(':');

        // Decrypt metadata
        const decryptedMetaStr = encryption.decryptMetadata(item.encryptedMetadata, metaIv, metaTag);
        const metadata = JSON.parse(decryptedMetaStr);

        // Decrypt the actual data
        const decryptedData = encryption.decrypt(encryptedData, dataIv, metadata.tag);

        if (item.type === 'note') {
            res.json({
                ...item.toObject(),
                content: decryptedData.toString('utf-8')
            });
        } else {
            const isInline = INLINE_MIME_TYPES.has(metadata.mimeType);
            res.set('Content-Type', metadata.mimeType);
            res.set('Content-Disposition',
                `${isInline ? 'inline' : 'attachment'}; filename="${metadata.originalName}"`
            );
            res.set('Cache-Control', 'private, no-store');
            res.send(decryptedData);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { title, noteContent } = req.body;
        const item = await VaultItem.findOne({ _id: req.params.id, userId: req.user.id });

        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (title) item.title = title;

        if (item.type === 'note' && noteContent) {
            const telegramService = new TelegramService();
            await telegramService.init();

            const dataBuffer = Buffer.from(noteContent, 'utf-8');
            const { iv, encryptedData, tag } = encryption.encrypt(dataBuffer);

            const metadataToEncrypt = JSON.stringify({
                originalName: 'note.txt',
                mimeType: 'text/plain',
                tag
            });
            const encryptedMeta = encryption.encryptMetadata(metadataToEncrypt);

            const newMessageId = await telegramService.uploadFile(encryptedData, `vault_${Date.now()}.enc`);

            try {
                await telegramService.deleteMessage(item.telegramMessageId);
            } catch (e) {
                console.error('Failed to delete old telegram message', e);
            }

            item.telegramMessageId = newMessageId;
            item.encryptedMetadata = encryptedMeta.encryptedData;
            item.iv = iv + ':' + encryptedMeta.iv + ':' + encryptedMeta.tag;
            item.size = dataBuffer.length;
        }

        await item.save();
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const item = await VaultItem.findOne({ _id: req.params.id, userId: req.user.id });
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const telegramService = new TelegramService();
        await telegramService.init();

        try {
            await telegramService.deleteMessage(item.telegramMessageId);
        } catch (e) {
            console.error('Failed to delete telegram message', e);
        }

        await VaultItem.deleteOne({ _id: item._id });
        res.json({ message: 'Item removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
