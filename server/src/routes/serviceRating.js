const express = require('express');
const router = express.Router();
const ServiceRatingController = require('../controllers/serviceRatingController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/:applyId/rating', verifyToken, ServiceRatingController.addRating);
router.get('/:applyId/rating', verifyToken, ServiceRatingController.getRating);

module.exports = router; 