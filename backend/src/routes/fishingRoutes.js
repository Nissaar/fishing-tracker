const express = require('express');
const fishingController = require('../controllers/fishingController');
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/database');

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
router.get('/fish-species', fishingController.getFishSpecies);
router.get('/location-stats/:locationId', fishingController.getLocationStats);
router.get('/best-conditions', fishingController.getBestConditions);
router.get('/global-predictions', fishingController.getGlobalPredictions);

// ==================== DYNAMIC DROPDOWN DATA ====================

// Default fallback data if tables don't exist
const defaultFishingTypes = [
  { id: 1, name: 'Casting' },
  { id: 2, name: 'Jigging' },
  { id: 3, name: 'Lapess Couler/Couler' },
  { id: 4, name: 'Dropshot' }
];

const defaultFishingMethods = [
  { id: 1, name: 'Land' },
  { id: 2, name: 'Boat' }
];

const defaultBaits = [
  { id: 1, name: 'Calamar', fishing_type_id: 3 },
  { id: 2, name: 'Baby calamar', fishing_type_id: 3 },
  { id: 3, name: 'Shrimp/Crevette', fishing_type_id: 3 },
  { id: 4, name: 'Macro', fishing_type_id: 3 },
  { id: 5, name: 'Bonit', fishing_type_id: 3 },
  { id: 6, name: 'Tidelures', fishing_type_id: 1 },
  { id: 7, name: 'Ti Tracer', fishing_type_id: 1 },
  { id: 8, name: 'Ton Zorz', fishing_type_id: 1 }
];

// Get fishing types (from database)
router.get('/dropdown/fishing-types', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM fishing_types WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    // Table might not exist, return defaults
    console.error('Error fetching fishing types (using defaults):', error.message);
    res.json(defaultFishingTypes);
  }
});

// Get fishing methods (from database)
router.get('/dropdown/fishing-methods', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM fishing_methods WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    // Table might not exist, return defaults
    console.error('Error fetching fishing methods (using defaults):', error.message);
    res.json(defaultFishingMethods);
  }
});

// Get fishing baits (with optional fishing_type filter)
router.get('/dropdown/baits', async (req, res) => {
  try {
    const { fishingTypeId, fishingTypeName } = req.query;
    let query = `
      SELECT fb.*, ft.name as fishing_type_name 
      FROM fishing_baits fb 
      LEFT JOIN fishing_types ft ON fb.fishing_type_id = ft.id
      WHERE fb.is_active = true
    `;
    const params = [];
    
    if (fishingTypeId) {
      query += ` AND fb.fishing_type_id = $${params.length + 1}`;
      params.push(fishingTypeId);
    } else if (fishingTypeName) {
      query += ` AND ft.name = $${params.length + 1}`;
      params.push(fishingTypeName);
    }
    
    // Also include baits that are not linked to any fishing type (universal baits)
    if (fishingTypeId || fishingTypeName) {
      query += ' OR fb.fishing_type_id IS NULL';
    }
    
    query += ' ORDER BY fb.name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    // Table might not exist, return defaults
    console.error('Error fetching baits (using defaults):', error.message);
    const { fishingTypeId } = req.query;
    if (fishingTypeId) {
      res.json(defaultBaits.filter(b => b.fishing_type_id === parseInt(fishingTypeId)));
    } else {
      res.json(defaultBaits);
    }
  }
});

// Get fish species (from database)
router.get('/dropdown/fish-species', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM fish_species WHERE is_active = true ORDER BY local_name'
    );
    // Format for display (local name with optional english/scientific)
    const species = result.rows.map(fish => ({
      ...fish,
      display: fish.english_name 
        ? `${fish.local_name} (${fish.english_name})`
        : fish.local_name
    }));
    res.json(species);
  } catch (error) {
    // Table might not exist, return empty array (will use existing fish species from fishingController)
    console.error('Error fetching fish species (using fallback):', error.message);
    res.json([]);
  }
});

// ==================== CUSTOM SUBMISSIONS ====================

// Submit custom dropdown value
router.post('/custom-submission', async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      dropdownType,
      value,
      description,
      fishing_type_id,
      local_name,
      english_name,
      scientific_name,
      fishing_log_id 
    } = req.body;

    // Map frontend names to backend expected format
    const submission_type = dropdownType || req.body.submission_type;
    const submitted_value = value || req.body.submitted_value;

    if (!submission_type || !submitted_value) {
      return res.status(400).json({ error: 'dropdownType and value are required' });
    }

    const validTypes = ['fishing_type', 'fishing_method', 'bait', 'fish_species'];
    if (!validTypes.includes(submission_type)) {
      return res.status(400).json({ error: 'Invalid submission type' });
    }

    // Try to insert into custom_dropdown_submissions table
    try {
      const result = await pool.query(
        `INSERT INTO custom_dropdown_submissions 
         (user_id, submission_type, submitted_value, description, fishing_type_id, local_name, english_name, scientific_name, fishing_log_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [userId, submission_type, submitted_value, description || null, fishing_type_id, local_name, english_name, scientific_name, fishing_log_id]
      );

      res.status(201).json({ 
        message: 'Custom submission recorded. It will be reviewed by an admin.',
        submission: result.rows[0] 
      });
    } catch (dbError) {
      // Table might not exist, try fallback to custom_fish_requests for fish species
      if (submission_type === 'fish_species' && dbError.code === '42P01') {
        const result = await pool.query(
          `INSERT INTO custom_fish_requests 
           (user_id, fish_name, fishing_log_id) 
           VALUES ($1, $2, $3) 
           RETURNING *`,
          [userId, submitted_value, fishing_log_id]
        );
        res.status(201).json({ 
          message: 'Custom fish request recorded. It will be reviewed by an admin.',
          submission: result.rows[0] 
        });
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    console.error('Error creating custom submission:', error);
    res.status(500).json({ error: 'Failed to create custom submission' });
  }
});

// ==================== TRIP RECOMMENDATIONS ====================

// Get personalized trip recommendations based on historical data
router.post('/trip-recommendations', async (req, res) => {
  try {
    const { location, fishingType, baitType, fishingMethod, date, startTime, endTime } = req.body;

    // Build query to find similar historical trips
    let query = `
      SELECT 
        fl.*,
        CASE WHEN fl.caught_fish = true OR fl.caught_fish::text = 'yes' THEN true ELSE false END as was_successful
      FROM fishing_logs fl
      WHERE 1=1
    `;
    const params = [];

    if (location) {
      params.push(location);
      query += ` AND (fl.location = $${params.length} OR fl.location_name = $${params.length})`;
    }

    if (fishingType) {
      params.push(fishingType);
      query += ` AND fl.fishing_type = $${params.length}`;
    }

    if (baitType && baitType !== 'other') {
      params.push(baitType);
      query += ` AND fl.bait = $${params.length}`;
    }

    if (fishingMethod) {
      params.push(fishingMethod);
      query += ` AND fl.fishing_method = $${params.length}`;
    }

    query += ' ORDER BY fl.log_date DESC LIMIT 100';

    const result = await pool.query(query, params);
    const historicalTrips = result.rows;

    if (historicalTrips.length === 0) {
      return res.json({
        hasData: false,
        successRate: 0,
        confidence: 0,
        historicalTrips: 0,
        rating: 'Unknown',
        message: 'No historical data available for these criteria. Recommendations will improve as more trips are logged.',
        tips: [
          'Try a broader search by removing some filters',
          'Log more trips to improve recommendations',
          'Check weather and tide conditions before heading out'
        ]
      });
    }

    // Calculate success rate
    const successfulTrips = historicalTrips.filter(t => t.was_successful);
    const successRate = Math.round((successfulTrips.length / historicalTrips.length) * 100);

    // Determine confidence based on data points
    const confidence = historicalTrips.length >= 20 ? 90 
                     : historicalTrips.length >= 10 ? 70 
                     : historicalTrips.length >= 5 ? 50 
                     : 30;

    // Determine rating
    const rating = successRate >= 70 ? 'Excellent' 
                 : successRate >= 50 ? 'Good' 
                 : successRate >= 30 ? 'Fair' 
                 : 'Poor';

    // Analyze conditions from successful trips
    const conditions = analyzeConditions(successfulTrips);

    // Generate tips
    const tips = [];
    if (conditions.bestMoonPhase && conditions.bestMoonPhase !== 'Unknown') {
      tips.push(`Best results during ${conditions.bestMoonPhase} moon phase`);
    }
    if (conditions.bestTide && conditions.bestTide !== 'Unknown') {
      tips.push(`${conditions.bestTide} tide conditions have been most successful`);
    }
    if (conditions.avgFishPerTrip > 0) {
      tips.push(`Average catch of ${conditions.avgFishPerTrip} fish per successful trip`);
    }
    if (successRate < 50) {
      tips.push('Consider trying different bait or location for better results');
    }

    // Generate best times based on historical data
    const bestTimes = [];
    if (successfulTrips.length > 0) {
      bestTimes.push({ period: 'Dawn', time: '05:00 - 07:00', reason: 'Peak feeding time' });
      bestTimes.push({ period: 'Dusk', time: '17:00 - 19:00', reason: 'Active feeding period' });
    }

    res.json({
      hasData: true,
      successRate,
      confidence,
      historicalTrips: historicalTrips.length,
      rating,
      conditions: {
        weather: 'Check forecast',
        tide: conditions.bestTide || 'Varies',
        moonPhase: conditions.bestMoonPhase || 'Any',
        wind: 'Light winds preferred'
      },
      tips,
      bestTimes,
      historicalData: {
        totalTrips: historicalTrips.length,
        successfulTrips: successfulTrips.length,
        avgCatch: conditions.avgFishPerTrip,
        topSpecies: 'Various'
      }
    });
  } catch (error) {
    console.error('Trip recommendations error:', error);
    res.status(500).json({ error: 'Failed to get trip recommendations' });
  }
});

// Helper function to analyze conditions from successful trips
function analyzeConditions(trips) {
  if (trips.length === 0) return { bestMoonPhase: 'Unknown', bestTide: 'Unknown', avgFishPerTrip: 0 };

  const moonPhaseCount = {};
  const tideCount = {};
  const fishActivityCount = {};

  trips.forEach(trip => {
    // Moon phase
    const moonPhase = trip.moon_phase?.split(' ').pop() || 'Unknown';
    moonPhaseCount[moonPhase] = (moonPhaseCount[moonPhase] || 0) + 1;

    // Tide level
    const tide = trip.sea_level?.split(' ')[0] || 'Unknown';
    tideCount[tide] = (tideCount[tide] || 0) + 1;

    // Fish activity
    if (trip.fish_activity) {
      fishActivityCount[trip.fish_activity] = (fishActivityCount[trip.fish_activity] || 0) + 1;
    }
  });

  const getBest = (countObj) => {
    const keys = Object.keys(countObj);
    if (keys.length === 0) return 'Unknown';
    return keys.reduce((a, b) => countObj[a] > countObj[b] ? a : b);
  };

  return {
    bestMoonPhase: getBest(moonPhaseCount),
    bestTide: getBest(tideCount),
    bestFishActivity: getBest(fishActivityCount),
    avgFishPerTrip: trips.length > 0 
      ? Math.round(trips.reduce((sum, t) => sum + (t.fish_count || 0), 0) / trips.length)
      : 0
  };
}

module.exports = router;