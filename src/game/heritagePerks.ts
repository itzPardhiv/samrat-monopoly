import { BoardTile } from './boardData';

export interface PlacePerk {
  title: string;
  description: string;
  effect: string;
}

export const PLACE_HERITAGE_PERKS: Record<string, PlacePerk> = {
  // India Heritage
  in_go: {
    title: 'Sovereign Gateway',
    description: 'The monumental entrance of the subcontinent.',
    effect: 'Collect ₹2,000 allowance each complete lap.',
  },
  in_jaipur: {
    title: 'Gemstone Monopoly',
    description: 'Famed Johari Bazaar and pink sandstone palaces.',
    effect: 'Doubled rent activates with only 2 properties in Rajputana.',
  },
  in_udaipur: {
    title: 'Lake Palace Haven',
    description: 'Marble floating sanctuary on Lake Pichola.',
    effect: 'Exempt from emergency property repair levies.',
  },
  in_varanasi: {
    title: 'Eternal Ghats',
    description: 'Sacred riverfront civilization active for 3,000+ years.',
    effect: '+₹200 divine blessing whenever passing through.',
  },
  in_rail_csmt: {
    title: 'Great Indian Transit',
    description: 'UNESCO Victorian Gothic terminus of the 1853 railway.',
    effect: 'Transit route collects +25% rent during Bull Market.',
  },
  in_amritsar: {
    title: 'Langar of Abundance',
    description: 'Sacred golden sanctum offering sanctuary and meals to all.',
    effect: 'Halves bail cost if sent to detention.',
  },
  in_agra: {
    title: 'Wonder of the World',
    description: 'Makrana white marble wonder and Pietra Dura jewel.',
    effect: 'Royal Mahal rent cannot be reduced or bypassed.',
  },
  in_jail: {
    title: 'Island Detention',
    description: 'Historic Cellular memorial in Port Blair.',
    effect: 'Safe visiting ground or pay ₹500 bail after 1 turn.',
  },
  in_kochi: {
    title: 'Malabar Spice Trade',
    description: 'Ancient pepper port and Arabian Sea trading depot.',
    effect: '+₹150 tariff collected when another player lands on transport.',
  },
  in_util_isro: {
    title: 'Orbital Telemetry',
    description: 'Satish Dhawan spaceport launching Chandrayaan missions.',
    effect: 'Earns 10x dice roll when rival lands on utility.',
  },
  in_goa: {
    title: 'Riviera Tourism',
    description: 'Historic Portuguese coastal fortress and sun-drenched shores.',
    effect: 'Generates +₹100 resort dividend at the close of every round.',
  },
  in_chennai: {
    title: 'Automotive & Port Hub',
    description: '7th-century Pallava granite temple beside modern auto corridor.',
    effect: 'Haveli/house upgrade costs discounted by ₹150.',
  },
  in_treasury: {
    title: 'Reserve Mandapam',
    description: 'National convention and treasury reserve kosh.',
    effect: 'Claim all accumulated tax and penalty deposits (minimum ₹500).',
  },
  in_kolkata: {
    title: 'Cultural Renaissance',
    description: 'Grand marble Victoria hall on the banks of Hooghly River.',
    effect: 'Grants +1 free draw on historical dispatch deck.',
  },
  in_hyderabad: {
    title: 'Golconda Diamond Vault',
    description: '1591 stucco minarets and City of Pearls trade.',
    effect: 'Mortgaging yields 65% cash instead of standard 50%.',
  },
  in_air_igi: {
    title: 'Sovereign Skyport',
    description: 'South Asia’s premier aviation crossroads.',
    effect: 'Owner travels between transport hubs at zero cost.',
  },
  in_bengaluru: {
    title: 'Silicon Plateau',
    description: 'Neo-Dravidian granite seat and deep-tech startup capital.',
    effect: '+₹300 venture dividend whenever any player lands on utilities.',
  },
  in_ahmedabad: {
    title: 'GIFT International',
    description: 'UNESCO World Heritage city paired with offshore FinTech hub.',
    effect: 'Completely exempt from luxury cess and municipal taxes.',
  },
  in_util_grid: {
    title: 'National Mega Grid',
    description: 'Bhadla clean solar complex powering state power corridors.',
    effect: 'Doubles utility payout if owner also owns ISRO.',
  },
  in_delhi: {
    title: 'Imperial Capital',
    description: 'Grand ceremonial axis ascending Raisina Hill.',
    effect: 'Stipend on GO boosted by +₹500 for the sovereign owner.',
  },
  in_mumbai: {
    title: 'Commercial Velocity',
    description: 'Basalt triumphal arch and financial engine of India.',
    effect: 'All bilateral trade agreements provide +10% cash bonus.',
  },

  // World Heritage
  wd_go: {
    title: 'Global Circumnavigation',
    description: 'International maritime meridian.',
    effect: 'Collect ₹2,000 sovereign dividend on each full lap.',
  },
  wd_cairo: {
    title: 'Pharaonic Vault',
    description: '4,500-year-old limestone Great Pyramid of Khufu.',
    effect: 'Ancient structure immune to maintenance levies and tax.',
  },
  wd_athens: {
    title: 'Philosophic Accord',
    description: '5th-century BCE Doric temple citadel overlooking the Aegean.',
    effect: 'Free appraisal and priority zero-commission bid during auctions.',
  },
  wd_rome: {
    title: 'Pax Romana',
    description: 'Iconic Flavian amphitheater arches in travertine stone.',
    effect: '+20% rent bonus when combined with European cultural capital.',
  },
  wd_paris: {
    title: 'Haute Culture',
    description: 'Eiffel iron lattice spire commanding Champ de Mars.',
    effect: 'Attracts 15% luxury surcharge whenever rival lands here.',
  },
  wd_london: {
    title: 'City of London Finance',
    description: 'Westminster gothic clock tower and square-mile financial centre.',
    effect: 'Can issue municipal liquidity bonds without mortgaging deeds.',
  },
  wd_newyork: {
    title: 'Wall Street Capital',
    description: 'Manhattan skyline, Empire State, and global securities exchange.',
    effect: 'Mortgaging yields 70% of deed cost instead of 50%.',
  },
  wd_tokyo: {
    title: 'Automated Metropolis',
    description: 'Senso-ji heritage temple nestled in high-speed urban grid.',
    effect: 'Haveli/House construction cost permanently reduced by 25%.',
  },
  wd_dubai: {
    title: 'Sovereign Freezone',
    description: 'Burj Khalifa supertall glass spire piercing the desert sky.',
    effect: 'Owner is immune to maritime customs and transit taxes.',
  },
  wd_singapore: {
    title: 'Malacca Strait Port',
    description: 'Marina Bay cantilever sky-park and global trade strait.',
    effect: 'Earns +₹200 whenever rival players transit between continents.',
  },
  wd_sydney: {
    title: 'Pacific Gateway',
    description: 'Iconic white shell sails over deep blue Pacific harbor.',
    effect: 'Collects +₹150 tourist tariff on all weekend rounds.',
  },
};

export function getTilePerk(tile: BoardTile): PlacePerk {
  const normId = tile.id.toLowerCase();
  if (PLACE_HERITAGE_PERKS[normId]) {
    return PLACE_HERITAGE_PERKS[normId];
  }
  const strippedId = normId.replace('in_', '').replace('wd_', '');
  for (const [key, perk] of Object.entries(PLACE_HERITAGE_PERKS)) {
    if (key.includes(strippedId)) {
      return perk;
    }
  }

  // Fallback signature perk based on tile type
  if (tile.type === 'transport') {
    return {
      title: 'Continental Transit',
      description: 'Global high-speed passenger & freight artery.',
      effect: 'Rent scales up automatically with every transit node acquired.',
    };
  }
  if (tile.type === 'utility') {
    return {
      title: 'Infrastructure Grid',
      description: 'Strategic energy and telecommunication backbone.',
      effect: 'Yields 4x or 10x dice multiplier based on utility monopoly.',
    };
  }
  return {
    title: 'Heritage Title',
    description: `${tile.name} in ${tile.stateOrCountry}.`,
    effect: 'Generates standard municipal deed rent.',
  };
}

export interface MarketClimate {
  cycle: 'bull' | 'stable' | 'recession';
  name: string;
  tag: string;
  description: string;
  rentMultiplier: number;
}

export function getMarketClimate(turnNumber: number): MarketClimate {
  const cycleIndex = Math.floor((turnNumber - 1) / 4) % 3;
  if (cycleIndex === 0) {
    return {
      cycle: 'stable',
      name: 'EQUILIBRIUM',
      tag: 'STABLE MARKET',
      description: 'Normal economic activity. Standard valuation and baseline rents apply.',
      rentMultiplier: 1.0,
    };
  }
  if (cycleIndex === 1) {
    return {
      cycle: 'bull',
      name: 'EXPANSION',
      tag: 'BULL MARKET (+20% RENT)',
      description: 'High capital velocity. All property rents boosted by +20%.',
      rentMultiplier: 1.2,
    };
  }
  return {
    cycle: 'recession',
    name: 'LIQUIDITY TIGHTENING',
    tag: 'BEAR RECESSION (-15% RENT)',
    description: 'Tight money supply. Rents -15%, but GO stipend boosted to ₹2,500.',
    rentMultiplier: 0.85,
  };
}

// Minimalist Black & White Player Styling (Stark Geometric Shapes & Hatches)
export const B_W_PLAYER_STYLES = [
  {
    id: 'p1',
    symbol: '●',
    name: 'Solid',
    border: 'border-white',
    badgeBg: 'bg-white text-black',
    tagText: 'PLAYER 1',
    accentColor: '#FFFFFF',
  },
  {
    id: 'p2',
    symbol: '○',
    name: 'Hollow',
    border: 'border-neutral-400',
    badgeBg: 'bg-neutral-800 text-white border border-neutral-400',
    tagText: 'PLAYER 2',
    accentColor: '#E5E5E5',
  },
  {
    id: 'p3',
    symbol: '■',
    name: 'Square',
    border: 'border-neutral-300',
    badgeBg: 'bg-neutral-700 text-white border border-neutral-300',
    tagText: 'PLAYER 3',
    accentColor: '#D4D4D4',
  },
  {
    id: 'p4',
    symbol: '◇',
    name: 'Diamond',
    border: 'border-neutral-500',
    badgeBg: 'bg-neutral-900 text-white border border-neutral-500',
    tagText: 'PLAYER 4',
    accentColor: '#A3A3A3',
  },
];
