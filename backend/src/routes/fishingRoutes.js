const express = require('express');
const fishingController = require('../controllers/fishingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/locations', fishingController.getLocations);
router.get('/environmental-data', fishingController.getEnvironmentalData);
router.post('/logs', fishingController.createLog);
router.get('/logs', fishingController.getLogs);
router.get('/logs/:id', fishingController.getLog);
router.put('/logs/:id', fishingController.updateLog);
router.delete('/logs/:id', fishingController.deleteLog);
router.get('/statistics', fishingController.getStatistics);

module.exports = router;