// Mauritius fish species with local/creole, English, and scientific names
const fishSpecies = [
  {
    id: 'capitaine',
    local: 'Capitaine',
    english: 'Spangled Emperor',
    scientific: 'Lethrinus nebulosus',
    display: 'Capitaine / Spangled Emperor / Lethrinus nebulosus'
  },
  {
    id: 'dame-berri',
    local: 'Dame berri',
    english: 'Blackspot Emperor',
    scientific: 'Lethrinus mahsena',
    display: 'Dame berri / Blackspot Emperor / Lethrinus mahsena'
  },
  {
    id: 'caya',
    local: 'Caya',
    english: 'Yellow-eye Emperor',
    scientific: 'Lethrinus rubrioperculatus',
    display: 'Caya / Yellow-eye Emperor / Lethrinus rubrioperculatus'
  },
  {
    id: 'vieille-rouge',
    local: 'Vieille rouge',
    english: 'Red Grouper',
    scientific: 'Epinephelus fasciatus',
    display: 'Vieille rouge / Red Grouper / Epinephelus fasciatus'
  },
  {
    id: 'vacoas',
    local: 'Vacoas',
    english: 'Green Jobfish',
    scientific: 'Aprion virescens',
    display: 'Vacoas / Green Jobfish / Aprion virescens'
  },
  {
    id: 'croissant-queue-jaune',
    local: 'Croissant queue jaune',
    english: 'Yellow-edged Lyretail',
    scientific: 'Variola louti',
    display: 'Croissant queue jaune / Yellow-edged Lyretail / Variola louti'
  },
  {
    id: 'croissant-queue-blanc',
    local: 'Croissant queue blanc',
    english: 'White-edged Lyretail',
    scientific: 'Variola albimarginata',
    display: 'Croissant queue blanc / White-edged Lyretail / Variola albimarginata'
  },
  {
    id: 'sacre-chien-rouge',
    local: 'Sacré chien rouge',
    english: 'Ruby Snapper',
    scientific: 'Etelis cabunculus',
    display: 'Sacré chien rouge / Ruby Snapper / Etelis cabunculus'
  },
  {
    id: 'sacre-chien-blanc',
    local: 'Sacré chien blanc',
    english: 'Bluestriped Snapper',
    scientific: 'Pristipomoides filamentosus',
    display: 'Sacré chien blanc / Bluestriped Snapper / Pristipomoides filamentosus'
  },
  {
    id: 'rouget-fayan',
    local: 'Rouget fayan',
    english: 'Goatfish',
    scientific: 'Parupeneus spp.',
    display: 'Rouget fayan / Goatfish / Parupeneus spp.'
  },
  {
    id: 'madame-tombee',
    local: 'Madame tombée',
    english: 'Flower Wrasse',
    scientific: 'Cheilinus chlorourus',
    display: 'Madame tombée / Flower Wrasse / Cheilinus chlorourus'
  },
  {
    id: 'dorade',
    local: 'Dorade',
    english: 'Mahi-mahi',
    scientific: 'Coryphaena hippurus',
    display: 'Dorade / Mahi-mahi / Coryphaena hippurus'
  },
  {
    id: 'thon-jaune',
    local: 'Thon jaune',
    english: 'Yellowfin tuna',
    scientific: 'Thunnus albacares',
    display: 'Thon jaune / Yellowfin tuna / Thunnus albacares'
  },
  {
    id: 'bonite',
    local: 'Bonite',
    english: 'Skipjack',
    scientific: 'Katsuwonus pelamis',
    display: 'Bonite / Skipjack / Katsuwonus pelamis'
  },
  {
    id: 'tazar',
    local: 'Tazar',
    english: 'Great Barracuda',
    scientific: 'Sphyraena barracuda',
    display: 'Tazar / Great Barracuda / Sphyraena barracuda'
  },
  {
    id: 'licorne',
    local: 'Licorne',
    english: 'Unicorn fish',
    scientific: 'Naso unicornis',
    display: 'Licorne / Unicorn fish / Naso unicornis'
  },
  {
    id: 'carangue-saumon',
    local: 'Carangue saumon',
    english: 'Rainbow Runner',
    scientific: 'Elagatis bipinnulata',
    display: 'Carangue saumon / Rainbow Runner / Elagatis bipinnulata'
  },
  {
    id: 'becune',
    local: 'Becune',
    english: 'Trevally',
    scientific: 'Carangidae',
    display: 'Becune / Trevally / Carangidae'
  },
  {
    id: 'espadon',
    local: 'Espadon',
    english: 'Swordfish',
    scientific: 'Xiphias gladius',
    display: 'Espadon / Swordfish / Xiphias gladius'
  },
  {
    id: 'marlin-bleu',
    local: 'Marlin bleu',
    english: 'Blue marlin',
    scientific: 'Makaira nigricans',
    display: 'Marlin bleu / Blue marlin / Makaira nigricans'
  },
  {
    id: 'homard',
    local: 'Homard',
    english: 'Spiny lobster',
    scientific: 'Panulirus spp.',
    display: 'Homard / Spiny lobster / Panulirus spp.'
  },
  {
    id: 'crabe',
    local: 'Crabe',
    english: 'Crab',
    scientific: 'Scylla spp.',
    display: 'Crabe / Crab / Scylla spp.'
  },
  {
    id: 'mourgate',
    local: 'Mourgate',
    english: 'Squid',
    scientific: 'Loligo spp.',
    display: 'Mourgate / Squid / Loligo spp.'
  }
];

// Fishing types with specific baits
const fishingTypes = {
  'Casting': {
    baits: ['Tidelures', 'Ti Tracer', 'Ton Zorz', 'Others']
  },
  'Jigging': {
    baits: [] // Free input
  },
  'Lapess Couler/Couler': {
    baits: ['Calamar', 'Baby calamar', 'Shrimp/Crevette', 'Macro', 'Bonit']
  },
  'Dropshot': {
    baits: ['jighead_softbait'] // Special case with 2 inputs
  }
};

module.exports = { fishSpecies, fishingTypes };
