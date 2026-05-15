const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, verify2fa, checkStatus } = require('../controllers/telegramController');
const { protect } = require('../middleware/auth');

router.get('/status', protect, checkStatus);
router.post('/send-otp', protect, sendOtp);
router.post('/verify-otp', protect, verifyOtp);
router.post('/verify-2fa', protect, verify2fa);

module.exports = router;
