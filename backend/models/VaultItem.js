const mongoose = require('mongoose');

const vaultItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String, // 'file' or 'note'
    required: true
  },
  mimeType: {
    type: String,
    default: 'application/octet-stream'
  },
  telegramMessageId: {
    type: Number,
    required: true
  },
  encryptedMetadata: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VaultItem', vaultItemSchema);
