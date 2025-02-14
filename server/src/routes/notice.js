const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', noticeController.getNotices);
router.post('/', verifyToken, noticeController.publishNotice);

module.exports = router; 