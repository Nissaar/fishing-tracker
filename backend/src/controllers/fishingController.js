const FishingLog = require('../models/FishingLog');
const { calculateMoonPhase } = require('../utils/moonPhase');
const { getWorldTidesData } = require('../services/tideService');
const { getCurrentWeather } = require('../services/weatherService');
const { allLocations } = require('../data/mauritiusLocations');

exports.getLocations = async (req, res) => {
  try {
    res.json({ locations: allLocations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get locations' });
  }
};

exports.getEnvironmentalData = async (req, res) => {
  try {
    const { date, locationId } = req.query;
    
    const location = allLocations.find(loc => loc.id === locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const moonData = calculateMoonPhase(date);
    const tideData = await getWorldTidesData(location.lat, location.lon, date);
    const weatherData = await getCurrentWeather(location.lat, location.lon);

    res.json({
      moon: moonData,
      tide: tideData,
      weather: weatherData,
      location: location
    });
  } catch (error) {
    console.error('Environmental data error:', error);
    res.status(500).json({ error: 'Failed to get environmental data' });
  }
};

exports.createLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const logData = req.body;
    
    const location = allLocations.find(loc => loc.id === logData.location);
    if (!location) {
      return res.status(400).json({ error: 'Invalid location' });
    }

    logData.locationName = location.name;
    
    const log = await FishingLog.create(userId, logData);
    
    res.status(201).json({
      message: 'Fishing log created successfully',
      log
    });
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit || 100;
    
    const logs = await FishingLog.findByUserId(userId, limit);
    
    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
};

exports.getLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const logId = req.params.id;
    
    const log = await FishingLog.findById(logId, userId);
    
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get log' });
  }
};

exports.updateLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const logId = req.params.id;
    const logData = req.body;
    
    const log = await FishingLog.update(logId, userId, logData);
    
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    
    res.json({
      message: 'Log updated successfully',
      log
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update log' });
  }
};

exports.deleteLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const logId = req.params.id;
    
    await FishingLog.delete(logId, userId);
    
    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete log' });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await FishingLog.getStatistics(userId);
    
    res.json({ statistics: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};