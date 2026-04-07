import { calculateEloChange } from './elo';

export interface Bot {
  id: number;
  name: string;
  elo: number;
  accuracy: number; // 0-1
  avgSpeed: number; // seconds
  gamesPlayed: number;
  wins: number;
  losses: number;
  streak: number;
}

const FIRST_NAMES = [
  'Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta','Iota','Kappa',
  'Lambda','Mu','Nu','Xi','Omicron','Pi','Rho','Sigma','Tau','Upsilon',
  'Phi','Chi','Psi','Omega','Neo','Hex','Byte','Pixel','Flux','Nova',
  'Pulse','Quark','Spark','Volt','Watt','Zero','Apex','Blitz','Core','Data',
  'Edge','Forge','Grid','Hash','Ion','Jet','Knot','Loop','Mesh','Node',
  'Orbit','Port','Quad','Root','Stack','Tera','Unit','Vec','Wire','Xor',
  'Zen','Arc','Bit','Cache','Disk','Echo','Fuse','Gate','Hub','Ink',
];

const SUFFIXES = [
  '-X','Bot','-3000','-AI','-v2','-Pro','-Lite','-Max','-Ultra','-Prime',
  '-Zero','-One','-9k','_mk2','_mk3','.exe','.ai','-OS','++','#',
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function generateBotName(id: number, rng: () => number): string {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const suffix = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
  return `${first}${suffix}`;
}

function generateBotElo(rng: () => number): number {
  // Distribution: most bots cluster around 800-1200, fewer at extremes
  const base = 400 + rng() * 1600; // 400-2000
  const noise = (rng() - 0.5) * 400; // ±200
  return Math.round(Math.max(300, Math.min(2500, base + noise)));
}

export function generateBots(count = 1024): Bot[] {
  const rng = seededRand(42);
  const bots: Bot[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name = generateBotName(i, rng);
    while (usedNames.has(name)) {
      name = generateBotName(i + Math.floor(rng() * 1000), rng);
    }
    usedNames.add(name);

    const elo = generateBotElo(rng);
    // Stats derived from ELO
    const accuracy = Math.min(0.98, Math.max(0.3, 0.4 + (elo - 400) / 3000));
    const avgSpeed = Math.max(0.8, 12 - (elo / 300));

    bots.push({
      id: i,
      name,
      elo,
      accuracy,
      avgSpeed,
      gamesPlayed: Math.floor(rng() * 200),
      wins: 0,
      losses: 0,
      streak: 0,
    });
  }

  // Set wins/losses based on games played
  for (const bot of bots) {
    const winRate = Math.min(0.9, Math.max(0.1, 0.3 + (bot.elo - 400) / 2500));
    bot.wins = Math.floor(bot.gamesPlayed * winRate);
    bot.losses = bot.gamesPlayed - bot.wins;
  }

  return bots;
}

// Simulate bot vs bot matchups to shake up leaderboard
export function simulateBotMatchups(bots: Bot[], rounds = 50): Bot[] {
  const updated = bots.map(b => ({ ...b }));
  const rng = seededRand(Date.now());

  for (let r = 0; r < rounds; r++) {
    // Pick two random bots with similar ELO
    const i = Math.floor(rng() * updated.length);
    let j = i;
    // Find opponent within ±300 ELO
    const candidates = updated.filter((b, idx) =>
      idx !== i && Math.abs(b.elo - updated[i].elo) < 300
    );
    if (candidates.length === 0) continue;
    const opponent = candidates[Math.floor(rng() * candidates.length)];
    j = updated.indexOf(opponent);

    const a = updated[i], b = updated[j];
    // Higher ELO has better chance
    const expectedA = 1 / (1 + Math.pow(10, (b.elo - a.elo) / 400));
    const aWins = rng() < expectedA;

    const changeA = calculateEloChange(a.elo, b.elo, aWins);
    const changeB = calculateEloChange(b.elo, a.elo, !aWins);

    a.elo = Math.max(200, a.elo + changeA);
    b.elo = Math.max(200, b.elo + changeB);
    a.gamesPlayed++;
    b.gamesPlayed++;

    if (aWins) {
      a.wins++; a.streak = Math.max(0, a.streak) + 1;
      b.losses++; b.streak = Math.min(0, b.streak) - 1;
    } else {
      b.wins++; b.streak = Math.max(0, b.streak) + 1;
      a.losses++; a.streak = Math.min(0, a.streak) - 1;
    }

    // Update derived stats
    a.accuracy = Math.min(0.98, Math.max(0.3, 0.4 + (a.elo - 400) / 3000));
    a.avgSpeed = Math.max(0.8, 12 - (a.elo / 300));
    b.accuracy = Math.min(0.98, Math.max(0.3, 0.4 + (b.elo - 400) / 3000));
    b.avgSpeed = Math.max(0.8, 12 - (b.elo / 300));
  }

  return updated;
}

// Bot storage
const BOTS_KEY = 'mathsprint_bots';
const BOTS_TIMESTAMP_KEY = 'mathsprint_bots_ts';

export function loadBots(): Bot[] {
  try {
    const raw = localStorage.getItem(BOTS_KEY);
    if (raw) {
      const bots = JSON.parse(raw) as Bot[];
      // Check if we need to simulate (every hour)
      const lastSim = parseInt(localStorage.getItem(BOTS_TIMESTAMP_KEY) || '0');
      const hoursSince = (Date.now() - lastSim) / (1000 * 60 * 60);
      if (hoursSince >= 1) {
        const rounds = Math.min(200, Math.floor(hoursSince * 50));
        const updated = simulateBotMatchups(bots, rounds);
        saveBots(updated);
        return updated;
      }
      return bots;
    }
  } catch {}
  // First time: generate and save
  const bots = generateBots(1024);
  saveBots(bots);
  return bots;
}

function saveBots(bots: Bot[]) {
  localStorage.setItem(BOTS_KEY, JSON.stringify(bots));
  localStorage.setItem(BOTS_TIMESTAMP_KEY, Date.now().toString());
}

export function updateBotsAfterMatch(bots: Bot[], botId: number, playerWon: boolean, playerElo: number): { bots: Bot[]; eloChange: number } {
  const updated = bots.map(b => ({ ...b }));
  const bot = updated.find(b => b.id === botId);
  if (!bot) return { bots: updated, eloChange: 0 };

  const eloChange = calculateEloChange(playerElo, bot.elo, playerWon);
  const botChange = calculateEloChange(bot.elo, playerElo, !playerWon);

  bot.elo = Math.max(200, bot.elo + botChange);
  bot.gamesPlayed++;
  if (playerWon) { bot.losses++; bot.streak = Math.min(0, bot.streak) - 1; }
  else { bot.wins++; bot.streak = Math.max(0, bot.streak) + 1; }

  bot.accuracy = Math.min(0.98, Math.max(0.3, 0.4 + (bot.elo - 400) / 3000));
  bot.avgSpeed = Math.max(0.8, 12 - (bot.elo / 300));

  saveBots(updated);
  return { bots: updated, eloChange };
}

export function getLeaderboard(bots: Bot[], mode: 'elo' | 'wins' | 'streak' = 'elo'): Bot[] {
  const sorted = [...bots];
  if (mode === 'elo') sorted.sort((a, b) => b.elo - a.elo);
  else if (mode === 'wins') sorted.sort((a, b) => b.wins - a.wins);
  else sorted.sort((a, b) => b.streak - a.streak);
  return sorted;
}

// Pick a matchup opponent near player's ELO
export function findOpponent(bots: Bot[], playerElo: number, range = 200): Bot {
  const candidates = bots.filter(b => Math.abs(b.elo - playerElo) <= range);
  if (candidates.length === 0) {
    // Widen search
    const sorted = [...bots].sort((a, b) => Math.abs(a.elo - playerElo) - Math.abs(b.elo - playerElo));
    return sorted[0];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}
