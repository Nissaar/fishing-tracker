const pool = require('../config/database');

class FishingLog {
  static async create(userId, logData) {
    const query = `
      INSERT INTO fishing_logs (
        user_id, log_date, location, location_name, caught_fish, fish_count, 
        fish_types, moon_phase, sea_level, tide_data, weather_data, hook_setup, bait, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const values = [
      userId,
      logData.date,
      logData.location,
      logData.locationName,
      logData.caughtFish,
      logData.fishCount || 0,
      JSON.stringify(logData.fishTypes || []),
      logData.moonPhase,
      logData.seaLevel,
      JSON.stringify(logData.tideData || {}),
      JSON.stringify(logData.weatherData || {}),
      logData.hookSetup,
      logData.bait,
      logData.notes || ''
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 100) {
    const query = `
      SELECT * FROM fishing_logs 
      WHERE user_id = $1 
      ORDER BY log_date DESC, created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows.map(row => ({
      ...row,
      fish_types: row.fish_types || [],
      tide_data: row.tide_data || {},
      weather_data: row.weather_data || {}
    }));
  }

  static async findById(id, userId) {
    const query = 'SELECT * FROM fishing_logs WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    if (result.rows[0]) {
      return {
        ...result.rows[0],
        fish_types: result.rows[0].fish_types || [],
        tide_data: result.rows[0].tide_data || {},
        weather_data: result.rows[0].weather_data || {}
      };
    }
    return null;
  }

  static async update(id, userId, logData) {
    const query = `
      UPDATE fishing_logs 
      SET log_date = $3, location = $4, location_name = $5, caught_fish = $6, fish_count = $7,
          fish_types = $8, moon_phase = $9, sea_level = $10, tide_data = $11, 
          weather_data = $12, hook_setup = $13, bait = $14, notes = $15
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const values = [
      id, userId, logData.date, logData.location, logData.locationName, logData.caughtFish,
      logData.fishCount || 0, JSON.stringify(logData.fishTypes || []),
      logData.moonPhase, logData.seaLevel, JSON.stringify(logData.tideData || {}),
      JSON.stringify(logData.weatherData || {}), logData.hookSetup, 
      logData.bait, logData.notes || ''
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id, userId) {
    const query = 'DELETE FROM fishing_logs WHERE id = $1 AND user_id = $2';
    await pool.query(query, [id, userId]);
  }

  static async getStatistics(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_trips,
        SUM(CASE WHEN caught_fish = true THEN 1 ELSE 0 END) as successful_trips,
        SUM(fish_count) as total_fish_caught,
        COUNT(DISTINCT location) as locations_visited
      FROM fishing_logs 
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = FishingLog;