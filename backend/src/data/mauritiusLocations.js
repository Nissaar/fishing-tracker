// Comprehensive list of ALL Mauritius fishing locations
const mauritiusLocations = {
  north: [
    { id: 'grand-baie', name: 'Grand Baie', lat: -20.0167, lon: 57.5833, type: 'beach', region: 'North' },
    { id: 'cap-malheureux', name: 'Cap Malheureux', lat: -19.9833, lon: 57.6167, type: 'beach', region: 'North' },
    { id: 'pointe-aux-piments', name: 'Pointe aux Piments', lat: -20.0333, lon: 57.5167, type: 'beach', region: 'North' },
    { id: 'trou-aux-biches', name: 'Trou aux Biches', lat: -20.0333, lon: 57.5500, type: 'beach', region: 'North' },
    { id: 'pereybere', name: 'Pereybere', lat: -20.0117, lon: 57.5883, type: 'beach', region: 'North' },
    { id: 'calodyne', name: 'Calodyne', lat: -19.9933, lon: 57.6350, type: 'shore', region: 'North' },
    { id: 'mont-choisy', name: 'Mont Choisy', lat: -20.0167, lon: 57.5500, type: 'beach', region: 'North' },
    { id: 'bain-boeuf', name: 'Bain Boeuf', lat: -19.9950, lon: 57.6200, type: 'beach', region: 'North' },
    { id: 'grand-gaube', name: 'Grand Gaube', lat: -19.9950, lon: 57.6600, type: 'village', region: 'North' },
    { id: 'goodlands', name: 'Goodlands', lat: -20.0350, lon: 57.6450, type: 'village', region: 'North' },
  ],
  east: [
    { id: 'belle-mare', name: 'Belle Mare', lat: -20.2000, lon: 57.7667, type: 'beach', region: 'East' },
    { id: 'trou-deau-douce', name: 'Trou d\'Eau Douce', lat: -20.2333, lon: 57.7833, type: 'beach', region: 'East' },
    { id: 'ile-aux-cerfs', name: 'Île aux Cerfs', lat: -20.2833, lon: 57.7917, type: 'island', region: 'East' },
    { id: 'roches-noires', name: 'Roches Noires', lat: -20.1167, lon: 57.7333, type: 'shore', region: 'East' },
    { id: 'poste-lafayette', name: 'Poste Lafayette', lat: -20.1167, lon: 57.7667, type: 'shore', region: 'East' },
    { id: 'grand-river-south-east', name: 'Grand River South East', lat: -20.2833, lon: 57.7833, type: 'river', region: 'East' },
    { id: 'poste-de-flacq', name: 'Poste de Flacq', lat: -20.1833, lon: 57.7500, type: 'shore', region: 'East' },
    { id: 'palmar', name: 'Palmar', lat: -20.2400, lon: 57.7800, type: 'beach', region: 'East' },
    { id: 'quatre-cocos', name: 'Quatre Cocos', lat: -20.2200, lon: 57.7650, type: 'beach', region: 'East' },
    { id: 'bras-deau', name: 'Bras d\'Eau', lat: -20.1000, lon: 57.7300, type: 'reserve', region: 'East' },
  ],
  south: [
    { id: 'mahebourg', name: 'Mahebourg', lat: -20.4083, lon: 57.7000, type: 'bay', region: 'South' },
    { id: 'blue-bay', name: 'Blue Bay', lat: -20.4333, lon: 57.7000, type: 'beach', region: 'South' },
    { id: 'souillac', name: 'Souillac', lat: -20.5167, lon: 57.5167, type: 'shore', region: 'South' },
    { id: 'le-morne', name: 'Le Morne', lat: -20.4500, lon: 57.3167, type: 'beach', region: 'South' },
    { id: 'riambel', name: 'Riambel', lat: -20.4667, lon: 57.5000, type: 'beach', region: 'South' },
    { id: 'baie-du-cap', name: 'Baie du Cap', lat: -20.4667, lon: 57.3833, type: 'bay', region: 'South' },
    { id: 'pointe-desny', name: 'Pointe d\'Esny', lat: -20.4167, lon: 57.7167, type: 'beach', region: 'South' },
    { id: 'gris-gris', name: 'Gris Gris', lat: -20.5167, lon: 57.5333, type: 'shore', region: 'South' },
    { id: 'st-felix', name: 'St Felix', lat: -20.4700, lon: 57.5500, type: 'village', region: 'South' },
    { id: 'bel-ombre', name: 'Bel Ombre', lat: -20.5000, lon: 57.4200, type: 'beach', region: 'South' },
    { id: 'ile-aux-aigrettes', name: 'Île aux Aigrettes', lat: -20.4167, lon: 57.7333, type: 'island', region: 'South' },
  ],
  west: [
    { id: 'flic-en-flac', name: 'Flic en Flac', lat: -20.2750, lon: 57.3667, type: 'beach', region: 'West' },
    { id: 'tamarin', name: 'Tamarin', lat: -20.3167, lon: 57.3667, type: 'beach', region: 'West' },
    { id: 'black-river', name: 'Black River (Grande Rivière Noire)', lat: -20.3667, lon: 57.3667, type: 'river', region: 'West' },
    { id: 'la-preneuse', name: 'La Preneuse', lat: -20.3833, lon: 57.3500, type: 'beach', region: 'West' },
    { id: 'albion', name: 'Albion', lat: -20.2167, lon: 57.4000, type: 'beach', region: 'West' },
    { id: 'wolmar', name: 'Wolmar', lat: -20.2917, lon: 57.3667, type: 'beach', region: 'West' },
    { id: 'petite-riviere-noire', name: 'Petite Rivière Noire', lat: -20.3600, lon: 57.3700, type: 'river', region: 'West' },
    { id: 'case-noyale', name: 'Case Noyale', lat: -20.3800, lon: 57.3600, type: 'village', region: 'West' },
  ],
  central: [
    { id: 'port-louis-harbour', name: 'Port Louis Harbour', lat: -20.1609, lon: 57.5012, type: 'harbour', region: 'Central' },
    { id: 'tombeau-bay', name: 'Tombeau Bay', lat: -20.1167, lon: 57.4833, type: 'bay', region: 'Central' },
    { id: 'baie-du-tombeau', name: 'Baie du Tombeau', lat: -20.1200, lon: 57.4850, type: 'bay', region: 'Central' },
  ],
  offshore: [
    { id: 'deep-sea-north', name: 'Deep Sea - North', lat: -19.8000, lon: 57.5000, type: 'deep-sea', region: 'Offshore' },
    { id: 'deep-sea-east', name: 'Deep Sea - East', lat: -20.2000, lon: 57.9000, type: 'deep-sea', region: 'Offshore' },
    { id: 'deep-sea-south', name: 'Deep Sea - South', lat: -20.6000, lon: 57.6000, type: 'deep-sea', region: 'Offshore' },
    { id: 'deep-sea-west', name: 'Deep Sea - West', lat: -20.3000, lon: 57.2000, type: 'deep-sea', region: 'Offshore' },
  ],
  islands: [
    { id: 'coin-de-mire', name: 'Coin de Mire', lat: -19.8833, lon: 57.6167, type: 'island', region: 'Islands' },
    { id: 'ile-plate', name: 'Île Plate', lat: -19.8667, lon: 57.6333, type: 'island', region: 'Islands' },
    { id: 'gabriel-island', name: 'Gabriel Island', lat: -19.8833, lon: 57.6500, type: 'island', region: 'Islands' },
    { id: 'ile-aux-benitiers', name: 'Île aux Bénitiers', lat: -20.3833, lon: 57.3333, type: 'island', region: 'Islands' },
    { id: 'flat-island', name: 'Flat Island', lat: -19.8667, lon: 57.6500, type: 'island', region: 'Islands' },
    { id: 'serpent-island', name: 'Serpent Island', lat: -19.9000, lon: 57.6300, type: 'island', region: 'Islands' },
    { id: 'round-island', name: 'Round Island', lat: -19.8500, lon: 57.7833, type: 'island', region: 'Islands' },
  ]
};

// Flatten all locations
const allLocations = [
  ...mauritiusLocations.north,
  ...mauritiusLocations.east,
  ...mauritiusLocations.south,
  ...mauritiusLocations.west,
  ...mauritiusLocations.central,
  ...mauritiusLocations.offshore,
  ...mauritiusLocations.islands,
];

module.exports = { mauritiusLocations, allLocations };
