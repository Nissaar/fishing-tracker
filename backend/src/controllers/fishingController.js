const FishingLog = require('../models/FishingLog');
const { calculateMoonPhase } = require('../utils/moonPhase');
const { getWorldTidesData } = require('../services/tideService');
const { getCurrentWeather } = require('../services/weatherService');
const { allLocations } = require('../data/mauritiusLocations');
const { getOpenMeteoMarineData, getSeaSurfaceTemperature } = require('../services/openMeteoService');
const pool = require('../config/database');

exports.getEnvironmentalData = async (req, res) => {
  try {
    const { date, locationId } = req.query;
    
    const location = allLocations.find(loc => loc.id === locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Get all environmental data
    const [moonData, tideData, weatherData, marineData, seaTemp] = await Promise.all([
      Promise.resolve(calculateMoonPhase(date)),
      getWorldTidesData(location.lat, location.lon, date),
      getCurrentWeather(location.lat, location.lon),
      getOpenMeteoMarineData(location.lat, location.lon, date),
      getSeaSurfaceTemperature(location.lat, location.lon, date)
    ]);

    res.json({
      moon: moonData,
      tide: tideData,
      weather: weatherData,
      marine: marineData,
      seaTemperature: seaTemp,
      location: location
    });
  } catch (error) {
    console.error('Environmental data error:', error);
    res.status(500).json({ error: 'Failed to get environmental data' });
  }
};

exports.getLocations = async (req, res) => {
  try {
    res.json({ locations: allLocations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get locations' });
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

exports.getGlobalPredictions = async (req, res) => {
  try {
    // Get ALL fishing logs from ALL users for predictions
    // Handle both boolean true and string 'yes' for backwards compatibility
    const query = `
      SELECT * FROM fishing_logs 
      WHERE caught_fish = true 
      OR caught_fish = 'yes'
      OR CAST(caught_fish AS TEXT) = 'true'
      ORDER BY log_date DESC 
      LIMIT 500
    `;
    const result = await pool.query(query);
    const allLogs = result.rows;
    
    if (allLogs.length === 0) {
      return res.json({ 
        message: 'Not enough community data yet. Be the first to log some catches!' 
      });
    }
    
    // Calculate predictions from all users' data
    const predictions = generatePredictionsFromLogs(allLogs);
    
    res.json({ 
      predictions,
      dataPoints: allLogs.length,
      message: `Based on ${allLogs.length} successful fishing trips from the community`
    });
  } catch (error) {
    console.error('Global predictions error:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
};

function generatePredictionsFromLogs(logs) {
  const moonPhaseCount = {};
  const seaLevelCount = {};
  const baitCount = {};
  const locationCount = {};
  const monthCount = {};

  logs.forEach((log) => {
    const phase = log.moon_phase?.split(' ')[1] || 'Unknown';
    moonPhaseCount[phase] = (moonPhaseCount[phase] || 0) + log.fish_count;

    const level = log.sea_level?.split(' ')[0] || 'Unknown';
    seaLevelCount[level] = (seaLevelCount[level] || 0) + log.fish_count;

    if (log.bait) {
      baitCount[log.bait] = (baitCount[log.bait] || 0) + log.fish_count;
    }

    if (log.location_name) {
      locationCount[log.location_name] = (locationCount[log.location_name] || 0) + log.fish_count;
    }

    const month = new Date(log.log_date).toLocaleString('default', { month: 'long' });
    monthCount[month] = (monthCount[month] || 0) + log.fish_count;
  });

  const bestMoonPhase = Object.keys(moonPhaseCount).reduce((a, b) =>
    moonPhaseCount[a] > moonPhaseCount[b] ? a : b, 'Unknown'
  );
  const bestSeaLevel = Object.keys(seaLevelCount).reduce((a, b) =>
    seaLevelCount[a] > seaLevelCount[b] ? a : b, 'Unknown'
  );
  const bestBait = Object.keys(baitCount).reduce((a, b) =>
    baitCount[a] > baitCount[b] ? a : b, 'Unknown'
  );
  const bestLocation = Object.keys(locationCount).reduce((a, b) =>
    locationCount[a] > locationCount[b] ? a : b, 'Unknown'
  );
  const bestMonth = Object.keys(monthCount).reduce((a, b) =>
    monthCount[a] > monthCount[b] ? a : b, 'Unknown'
  );

  return {
    bestMoonPhase,
    bestSeaLevel,
    bestBait,
    bestLocation,
    bestMonth,
    totalFish: logs.reduce((sum, log) => sum + log.fish_count, 0),
    avgPerTrip: (logs.reduce((sum, log) => sum + log.fish_count, 0) / logs.length).toFixed(1)
  };
}