const express = require('express');
const ResourceController = require('../controllers/resourceController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/list', verifyToken, ResourceController.getResources);
router.post('/create', verifyToken, ResourceController.createResource);
router.delete('/:id', verifyToken, ResourceController.deleteResource);
router.get('/:resourceId/bookings', verifyToken, ResourceController.getResourceBookings);
router.get('/list/:type', verifyToken, ResourceController.getResourcesByType);
router.get('/:resourceId/schedule', verifyToken, ResourceController.getResourceSchedule);

module.exports = router; 