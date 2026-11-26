import { EquippedLoadout, ShopItem, ShopPerks, TeamId } from '../types';

export const SHOP_ITEMS: ShopItem[] = [
  // ================= CARS =================
  {
    id: 'car-starter',
    category: 'car',
    name: 'Speedway Roadster',
    description: 'Classic team speedster built for sunny track days!',
    perkLabel: 'Balanced Starter',
    price: 0,
    perks: {},
  },
  {
    id: 'car-lightning',
    category: 'car',
    name: 'Lightning Bolt',
    description: 'Aerodynamic racing stripes for zippy straightaways.',
    perkLabel: '+6% Distance per Answer',
    price: 120,
    perks: { speedBonus: 0.06 },
    accentColor: '#facc15',
  },
  {
    id: 'car-monster',
    category: 'car',
    name: 'Off-Road Crusher',
    description: 'Oversized chunky wheels that laugh at spin-outs!',
    perkLabel: '25% Faster Recovery',
    price: 200,
    perks: { spinoutReduction: 0.25 },
    accentColor: '#a855f7',
  },
  {
    id: 'car-rocket',
    category: 'car',
    name: 'Rocket Dragster',
    description: 'Twin jet thrusters built for explosive Turbo Boosts!',
    perkLabel: '+25% Turbo Boost Power',
    price: 320,
    perks: { turboBonus: 0.25 },
    accentColor: '#f97316',
  },
  {
    id: 'car-champion',
    category: 'car',
    name: 'Golden Champion',
    description: 'Sparkling gold trophy racer fit for a math superstar!',
    perkLabel: '+5% Speed & +15% Coins',
    price: 500,
    perks: { speedBonus: 0.05, coinMultiplier: 0.15 },
    accentColor: '#eab308',
  },

  // ================= PERFORMANCE GEAR =================
  {
    id: 'gear-stock',
    category: 'gear',
    name: 'Stock Tune-Up',
    description: 'Reliable factory engine & tires ready to roll.',
    perkLabel: 'Standard Tuning',
    price: 0,
    perks: {},
  },
  {
    id: 'gear-tires',
    category: 'gear',
    name: 'Sticky Racing Tires',
    description: 'Super-grip rubber cuts wrong-answer spin-outs nearly in half!',
    perkLabel: '40% Faster Recovery',
    price: 100,
    perks: { spinoutReduction: 0.4 },
    accentColor: '#38bdf8',
  },
  {
    id: 'gear-magnet',
    category: 'gear',
    name: 'Golden Coin Magnet',
    description: 'Pulls in extra Speed Coins after every single race!',
    perkLabel: '+30% Speed Coins',
    price: 160,
    perks: { coinMultiplier: 0.3 },
    accentColor: '#f59e0b',
  },
  {
    id: 'gear-turbo',
    category: 'gear',
    name: 'Quick-Charge Turbo',
    description: 'Triggers your unique Turbo animation after just 2 in a row!',
    perkLabel: 'Turbo on 2-Streak',
    price: 180,
    perks: { turboStreakReq: 2 },
    accentColor: '#ec4899',
  },
  {
    id: 'gear-engine',
    category: 'gear',
    name: 'Super V8 Engine',
    description: 'Roaring horsepower pushes you farther on every right answer!',
    perkLabel: '+10% Distance per Answer',
    price: 240,
    perks: { speedBonus: 0.1 },
    accentColor: '#ef4444',
  },

  // ================= DRIVER ACCESSORIES =================
  {
    id: 'acc-none',
    category: 'accessory',
    name: 'Natural Plush',
    description: 'Classic cuddly look straight off the shelf!',
    perkLabel: 'Classic Style',
    price: 0,
    perks: {},
  },
  {
    id: 'acc-goggles',
    category: 'accessory',
    name: 'Aviator Goggles',
    description: 'Shiny gold wind-proof goggles for high-speed zooms!',
    perkLabel: 'Style + 5% Bonus Coins',
    price: 80,
    perks: { coinMultiplier: 0.05 },
  },
  {
    id: 'acc-shades',
    category: 'accessory',
    name: 'Cool Star Shades',
    description: 'Super-cool racing sunglasses for sunny speedway wins!',
    perkLabel: 'Style + 5% Bonus Coins',
    price: 100,
    perks: { coinMultiplier: 0.05 },
  },
  {
    id: 'acc-helmet',
    category: 'accessory',
    name: 'Pro Racing Helmet',
    description: 'Official checkered speedway helmet with racing visor!',
    perkLabel: 'Style + 10% Recovery',
    price: 150,
    perks: { spinoutReduction: 0.1 },
  },
  {
    id: 'acc-crown',
    category: 'accessory',
    name: 'Speedway Crown',
    description: 'Royal sparkling crown for the reigning math champion!',
    perkLabel: 'Style + 10% Bonus Coins',
    price: 280,
    perks: { coinMultiplier: 0.1 },
  },

  // ================= TRAILS =================
  {
    id: 'trail-classic',
    category: 'trail',
    name: 'Classic Puffs',
    description: 'Cheerful white arcade exhaust clouds.',
    perkLabel: 'Classic Trail',
    price: 0,
    perks: {},
  },
  {
    id: 'trail-flames',
    category: 'trail',
    name: 'Rocket Flames',
    description: 'Blazing orange & gold fire streaks behind your wheels!',
    perkLabel: 'Fiery Visual Trail',
    price: 90,
    perks: {},
  },
  {
    id: 'trail-stars',
    category: 'trail',
    name: 'Sparkling Stars',
    description: 'Glittering golden stars twinkling down the asphalt!',
    perkLabel: 'Starry Visual Trail',
    price: 120,
    perks: {},
  },
  {
    id: 'trail-team',
    category: 'trail',
    name: 'Signature Team Trail',
    description: 'Glowing paw prints for Doggy or tropical leaves for Slothy!',
    perkLabel: 'Team Mascot Trail',
    price: 140,
    perks: {},
  },
  {
    id: 'trail-rainbow',
    category: 'trail',
    name: 'Rainbow Comet',
    description: 'A dazzling rainbow ribbon zooming around the whole track!',
    perkLabel: 'Rainbow Visual Trail',
    price: 220,
    perks: {},
  },

  // ================= CAR SOUNDS =================
  {
    id: 'sound-classic',
    category: 'sound',
    name: 'Classic Arcade',
    description: 'Bright cheerful chimes with a gentle racecar purr.',
    perkLabel: 'Starter Sound Pack',
    price: 0,
    perks: {},
  },
  {
    id: 'sound-vroom',
    category: 'sound',
    name: 'Super Vroom Racer',
    description: 'Roaring twin-turbo engine revs on every right answer!',
    perkLabel: 'Racecar Engine SFX',
    price: 70,
    perks: {},
  },
  {
    id: 'sound-horn',
    category: 'sound',
    name: 'Silly Fun Horn',
    description: 'Bouncy cartoon horn honks & goofy boings!',
    perkLabel: 'Goofy Horn SFX',
    price: 90,
    perks: {},
  },
  {
    id: 'sound-laser',
    category: 'sound',
    name: 'Space Laser Zoom',
    description: 'Futuristic sci-fi pew-pew blasts & hyperdrive whooshes!',
    perkLabel: 'Sci-Fi Laser SFX',
    price: 130,
    perks: {},
  },
  {
    id: 'sound-retro',
    category: 'sound',
    name: '8-Bit Retro Bloops',
    description: 'Classic Nintendo-style chiptune power-up bloops!',
    perkLabel: '8-Bit Arcade SFX',
    price: 150,
    perks: {},
  },

  // ================= CAR RADIO STATIONS =================
  {
    id: 'radio-off',
    category: 'radio',
    name: 'Radio Off',
    description: 'Quiet cockpit — just listen to your engine & sound effects.',
    perkLabel: 'No Music',
    price: 0,
    perks: {},
  },
  {
    id: 'radio-pop',
    category: 'radio',
    name: 'Sunny Pop FM',
    description: 'Upbeat, happy sunshine melody to cruise the speedway!',
    perkLabel: 'Free Starter Station',
    price: 0,
    perks: {},
  },
  {
    id: 'radio-chiptune',
    category: 'radio',
    name: '8-Bit Arcade FM',
    description: 'High-energy retro video game chiptune racing anthem!',
    perkLabel: 'Retro Game Music',
    price: 80,
    perks: {},
  },
  {
    id: 'radio-tropical',
    category: 'radio',
    name: 'Jungle Island Beat',
    description: 'Bouncy tropical marimba & steel-drum island groove!',
    perkLabel: 'Tropical Music',
    price: 110,
    perks: {},
  },
  {
    id: 'radio-rock',
    category: 'radio',
    name: 'Speedway Rock FM',
    description: 'Driving electric bassline & stadium rock riff!',
    perkLabel: 'Rock & Roll Music',
    price: 140,
    perks: {},
  },
  {
    id: 'radio-disco',
    category: 'radio',
    name: 'Cosmic Dance Party',
    description: 'Sparkling synth-pop dance beats for turbo speed!',
    perkLabel: 'Dance Pop Music',
    price: 180,
    perks: {},
  },

  // ================= VICTORY CELEBRATIONS =================
  {
    id: 'cel-confetti',
    category: 'celebration',
    name: 'Classic Confetti',
    description: 'A joyful team-colored confetti pop at the finish line!',
    perkLabel: 'Starter Celebration',
    price: 0,
    perks: {},
  },
  {
    id: 'cel-fireworks',
    category: 'celebration',
    name: 'Fireworks Finale',
    description: 'Dazzling multi-burst sky fireworks exploding over the podium!',
    perkLabel: 'Sky Fireworks Show',
    price: 100,
    perks: {},
  },
  {
    id: 'cel-stars',
    category: 'celebration',
    name: 'Superstar Shower',
    description: 'Shining golden stars & sparkles raining down in victory!',
    perkLabel: 'Golden Star Show',
    price: 130,
    perks: {},
  },
  {
    id: 'cel-rainbow',
    category: 'celebration',
    name: 'Rainbow Party Cannons',
    description: 'Twin rainbow cannons firing nonstop from both sides!',
    perkLabel: 'Rainbow Cannon Show',
    price: 170,
    perks: {},
  },
  {
    id: 'cel-champion',
    category: 'celebration',
    name: 'Royal Trophy Blast',
    description: 'Ultimate champion dance + golden coin & trophy explosion!',
    perkLabel: 'Ultimate Victory Show',
    price: 220,
    perks: {},
  },
];

export const DEFAULT_LOADOUT: EquippedLoadout = {
  carId: 'car-starter',
  gearId: 'gear-stock',
  accessoryId: 'acc-none',
  trailId: 'trail-classic',
  soundId: 'sound-classic',
  radioId: 'radio-pop',
  celebrationId: 'cel-confetti',
};

export const DEFAULT_UNLOCKED_IDS = [
  'car-starter',
  'gear-stock',
  'acc-none',
  'trail-classic',
  'sound-classic',
  'radio-off',
  'radio-pop',
  'cel-confetti',
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

export function getEffectivePerks(
  loadout: EquippedLoadout,
  fairRaceNoPerks: boolean
): Required<ShopPerks> {
  if (fairRaceNoPerks) {
    return {
      speedBonus: 0,
      turboBonus: 0,
      spinoutReduction: 0,
      turboStreakReq: 3,
      coinMultiplier: 0,
    };
  }

  const items = [
    getShopItem(loadout.carId),
    getShopItem(loadout.gearId),
    getShopItem(loadout.accessoryId),
    getShopItem(loadout.trailId),
  ].filter(Boolean) as ShopItem[];

  let speedBonus = 0;
  let turboBonus = 0;
  let spinoutReduction = 0;
  let turboStreakReq = 3;
  let coinMultiplier = 0;

  for (const item of items) {
    speedBonus += item.perks.speedBonus ?? 0;
    turboBonus += item.perks.turboBonus ?? 0;
    spinoutReduction += item.perks.spinoutReduction ?? 0;
    coinMultiplier += item.perks.coinMultiplier ?? 0;
    if (item.perks.turboStreakReq && item.perks.turboStreakReq < turboStreakReq) {
      turboStreakReq = item.perks.turboStreakReq;
    }
  }

  return {
    speedBonus,
    turboBonus,
    spinoutReduction: Math.min(0.65, spinoutReduction),
    turboStreakReq,
    coinMultiplier,
  };
}

export function getTeamMeta(team: TeamId) {
  if (team === 'doggy') {
    return {
      name: 'Team Doggy',
      shortName: 'Doggy',
      primary: '#e11d48',
      secondary: '#f59e0b',
      lightBg: '#fff1f2',
      border: '#fda4af',
      portrait: './art/doggy-portrait.jpg',
      turboArt: './art/doggy-turbo.jpg',
      turboTitle: 'WOOF TURBO!',
      turboSubtitle: 'Red ears flying at maximum speed!',
      emoji: '🐶',
    };
  }
  return {
    name: 'Team Slothy',
    shortName: 'Slothy',
    primary: '#0d9488',
    secondary: '#10b981',
    lightBg: '#f0fdfa',
    border: '#5eead4',
    portrait: './art/slothy-portrait.jpg',
    turboArt: './art/slothy-turbo.jpg',
    turboTitle: 'SUPERSONIC SLOTH!',
    turboSubtitle: 'Goggles on — rainbow turbo engaged!',
    emoji: '🦥',
  };
}
