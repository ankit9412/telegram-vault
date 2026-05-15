const express = require('express');
const router = express.Router();
const { uploadItem, getItems, getItem, updateItem, deleteItem } = require('../controllers/vaultController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// Memory storage for multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit per file, can adjust
    }
});

router.route('/items')
    .get(protect, getItems);

router.post('/upload', protect, upload.single('file'), uploadItem);

router.route('/item/:id')
    .get(protect, getItem)
    .put(protect, updateItem)
    .delete(protect, deleteItem);

module.exports = router;
