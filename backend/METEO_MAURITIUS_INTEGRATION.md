# Meteo Mauritius Integration

This integration provides accurate sunrise, sunset, moonrise, and moonset times from the official Mauritius Meteorological Services website.

## Features

- **Accurate Data**: Scrapes real data from Meteo Mauritius official website
- **Automatic Caching**: Caches data for 24 hours to minimize web requests
- **Fallback Support**: Falls back to mathematical approximations if scraping fails
- **Python Integration**: Uses the `meteomoris` library for reliable data extraction

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or install individually:
```bash
pip install meteomoris beautifulsoup4 requests
```

### 2. Test the Python Script

```bash
cd backend/src/services
python3 meteo_mauritius_scraper.py sunrisemu
python3 meteo_mauritius_scraper.py moonrisemu
```

You should see JSON output with sunrise/sunset or moonrise/moonset data.

### 3. Verify Python Path

Make sure `python3` is available in your system PATH. If not, update the spawn command in `meteoMauritiusService.js`:

```javascript
const python = spawn('python3', [pythonScript, command]);
// Or use 'python' instead of 'python3' on some systems
```

### 4. Test the Integration

The integration is now active in your solunar calculations. When you:
- View the landing page conditions
- Log a fishing trip
- Check solunar data

The system will automatically fetch accurate times from Meteo Mauritius.

## Data Sources

### Sunrise/Sunset
- **Source**: https://metservice.intnet.mu/sun-moon-and-tides-sunrise-sunset-mauritius.php
- **Update Frequency**: Monthly (provides data for current and next month)
- **Library**: `meteomoris.get_sunrisemu()`

### Moonrise/Moonset
- **Source**: https://metservice.intnet.mu/sun-moon-and-tides-moonrise-moonset-mauritius.php
- **Update Frequency**: Monthly (provides data for current and next month)
- **Method**: Custom BeautifulSoup scraper (moonrise data not directly in meteomoris)

## Data Structure

### Sunrise/Sunset Response
```json
{
  "january": {
    "1": {"rise": "05:33", "set": "18:53"},
    "2": {"rise": "05:34", "set": "18:53"},
    ...
  },
  "february": {
    "1": {"rise": "05:53", "set": "18:53"},
    ...
  }
}
```

### Moonrise/Moonset Response
```json
{
  "january": {
    "1": {"rise": "17:02", "set": "02:57"},
    "2": {"rise": "18:09", "set": "03:59"},
    ...
  },
  "february": {
    "1": {"rise": "18:41", "set": "05:00"},
    ...
  }
}
```

## Caching Strategy

- **Cache Duration**: 24 hours
- **Location**: In-memory (resets on server restart)
- **Benefit**: Reduces load on Meteo Mauritius servers and improves response time

To clear cache, simply restart your Node.js server.

## Fallback Behavior

If the Meteo Mauritius website is unavailable or scraping fails, the system automatically falls back to mathematical approximations:

- **Sunrise/Sunset**: Based on seasonal sine wave variations for ~20°S latitude
- **Moonrise/Moonset**: Based on lunar age calculation (~50 minutes later each day)

This ensures your application continues to function even if external data sources are temporarily unavailable.

## Troubleshooting

### Python script not found
**Error**: `ENOENT: no such file or directory, spawn python3`

**Solution**: Install Python 3 or update the spawn command to use `python` instead of `python3`.

### Module not found error
**Error**: `ModuleNotFoundError: No module named 'meteomoris'`

**Solution**: Run `pip install meteomoris` or check your Python environment.

### Timeout errors
**Error**: `Failed to fetch Meteo Mauritius data`

**Solution**: Check your internet connection. The system will automatically use fallback approximations.

### Data format errors
**Error**: `Failed to parse Python output`

**Solution**: Test the Python script directly to see the raw output. Ensure the JSON structure is valid.

## API Changes in solunarTheory.js

### Before
```javascript
function calculateSolunarPeriods(dateStr, latitude, longitude) {
  // Synchronous function with approximations
}
```

### After
```javascript
async function calculateSolunarPeriods(dateStr, latitude, longitude) {
  // Async function with real data from Meteo Mauritius
}
```

⚠️ **Important**: All calls to `calculateSolunarPeriods` must now use `await`.

## Performance Considerations

- **First Request**: ~2-3 seconds (scrapes website)
- **Cached Requests**: ~10-50ms (instant from memory)
- **Fallback**: ~1-5ms (mathematical calculation)

## Credits

- **Meteo Mauritius**: Official meteorological service of Mauritius
- **meteomoris**: Python library by [@Abdur-rahmaanJ](https://github.com/Abdur-rahmaanJ/meteomoris)
- **BeautifulSoup**: HTML/XML parser for web scraping

## Future Improvements

- [ ] Add persistent caching (Redis/database)
- [ ] Implement rate limiting
- [ ] Add support for Rodrigues island
- [ ] Create admin panel to view cache status
- [ ] Add webhook notifications for data updates
