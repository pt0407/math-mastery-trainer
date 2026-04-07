import { Bot } from './bots';

export type TournamentFormat = 'single_elim' | 'double_elim' | 'round_robin' | 'swiss';

export interface TournamentMatch {
  id: string;
  round: number;
  player1: { type: 'player' | 'bot'; bot?: Bot; name: string };
  player2: { type: 'player' | 'bot'; bot?: Bot; name: string } | null; // null = bye
  winner?: 'player1' | 'player2';
  score1?: number;
  score2?: number;
  bracket?: 'winners' | 'losers'; // for double elim
}

export interface Tournament {
  format: TournamentFormat;
  size: number; // 8, 16, 32
  matches: TournamentMatch[];
  currentMatchIndex: number;
  playerEliminated: boolean;
  playerWins: number;
  playerLosses: number;
  completed: boolean;
  round: number;
}

export const TOURNAMENT_FORMATS: Record<TournamentFormat, { label: string; emoji: string; desc: string }> = {
  single_elim: { label: 'Single Elimination', emoji: '⚔️', desc: 'Lose once, you\'re out' },
  double_elim: { label: 'Double Elimination', emoji: '🛡️', desc: 'Two losses to eliminate' },
  round_robin: { label: 'Round Robin', emoji: '🔄', desc: 'Play everyone once' },
  swiss: { label: 'Swiss', emoji: '🇨🇭', desc: 'Paired by record each round' },
};

function generateMatchId(round: number, match: number): string {
  return `r${round}-m${match}`;
}

export function createTournament(
  format: TournamentFormat,
  bots: Bot[],
  size: number
): Tournament {
  // Pick bots sorted by ELO, spread across tiers
  const sorted = [...bots].sort((a, b) => b.elo - a.elo);
  const selectedBots = selectTournamentBots(sorted, size - 1); // -1 for player

  const participants: TournamentMatch['player1'][] = [
    { type: 'player', name: 'You' },
    ...selectedBots.map(b => ({ type: 'bot' as const, bot: b, name: b.name })),
  ];

  // Shuffle for seeding
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }

  switch (format) {
    case 'single_elim': return createSingleElim(participants, format, size);
    case 'double_elim': return createDoubleElim(participants, format, size);
    case 'round_robin': return createRoundRobin(participants, format, size);
    case 'swiss': return createSwiss(participants, format, size);
  }
}

function selectTournamentBots(sorted: Bot[], count: number): Bot[] {
  if (sorted.length <= count) return sorted.slice(0, count);
  // Spread across ELO tiers
  const step = Math.floor(sorted.length / count);
  const selected: Bot[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.min(i * step + Math.floor(Math.random() * step), sorted.length - 1);
    if (!selected.includes(sorted[idx])) {
      selected.push(sorted[idx]);
    } else {
      selected.push(sorted[i % sorted.length]);
    }
  }
  return selected.slice(0, count);
}

function createSingleElim(
  participants: TournamentMatch['player1'][],
  format: TournamentFormat,
  size: number
): Tournament {
  const matches: TournamentMatch[] = [];
  // Round 1
  for (let i = 0; i < participants.length; i += 2) {
    matches.push({
      id: generateMatchId(1, i / 2),
      round: 1,
      player1: participants[i],
      player2: participants[i + 1] || null,
    });
  }
  // Generate placeholder matches for future rounds
  const totalRounds = Math.ceil(Math.log2(size));
  let prevRoundStart = 0;
  let prevRoundSize = matches.length;
  for (let r = 2; r <= totalRounds; r++) {
    const roundMatches = Math.ceil(prevRoundSize / 2);
    for (let m = 0; m < roundMatches; m++) {
      matches.push({
        id: generateMatchId(r, m),
        round: r,
        player1: { type: 'bot', name: 'TBD' },
        player2: { type: 'bot', name: 'TBD' },
      });
    }
    prevRoundStart += prevRoundSize;
    prevRoundSize = roundMatches;
  }

  return { format, size, matches, currentMatchIndex: findPlayerMatch(matches), playerEliminated: false, playerWins: 0, playerLosses: 0, completed: false, round: 1 };
}

function createDoubleElim(
  participants: TournamentMatch['player1'][],
  format: TournamentFormat,
  size: number
): Tournament {
  // Same as single elim but with losers bracket tracking
  const matches: TournamentMatch[] = [];
  for (let i = 0; i < participants.length; i += 2) {
    matches.push({
      id: generateMatchId(1, i / 2),
      round: 1,
      player1: participants[i],
      player2: participants[i + 1] || null,
      bracket: 'winners',
    });
  }
  const totalRounds = Math.ceil(Math.log2(size));
  let prevSize = matches.length;
  for (let r = 2; r <= totalRounds; r++) {
    const roundMatches = Math.ceil(prevSize / 2);
    for (let m = 0; m < roundMatches; m++) {
      matches.push({ id: generateMatchId(r, m), round: r, player1: { type: 'bot', name: 'TBD' }, player2: { type: 'bot', name: 'TBD' }, bracket: 'winners' });
    }
    prevSize = roundMatches;
  }
  // Losers bracket rounds
  for (let r = 1; r <= totalRounds - 1; r++) {
    const lm = Math.max(1, Math.ceil(size / Math.pow(2, r + 1)));
    for (let m = 0; m < lm; m++) {
      matches.push({ id: `L-r${r}-m${m}`, round: r, player1: { type: 'bot', name: 'TBD' }, player2: { type: 'bot', name: 'TBD' }, bracket: 'losers' });
    }
  }

  return { format, size, matches, currentMatchIndex: findPlayerMatch(matches), playerEliminated: false, playerWins: 0, playerLosses: 0, completed: false, round: 1 };
}

function createRoundRobin(
  participants: TournamentMatch['player1'][],
  format: TournamentFormat,
  size: number
): Tournament {
  const matches: TournamentMatch[] = [];
  // Only generate player matches (vs each bot)
  let round = 1;
  for (let i = 1; i < participants.length; i++) {
    const playerIdx = participants.findIndex(p => p.type === 'player');
    if (playerIdx === -1) continue;
    matches.push({
      id: generateMatchId(round, i),
      round,
      player1: participants[playerIdx],
      player2: participants[i === playerIdx ? 0 : i],
    });
    round++;
  }

  return { format, size, matches, currentMatchIndex: 0, playerEliminated: false, playerWins: 0, playerLosses: 0, completed: false, round: 1 };
}

function createSwiss(
  participants: TournamentMatch['player1'][],
  format: TournamentFormat,
  size: number
): Tournament {
  // Swiss: ceil(log2(n)) rounds, pair by record
  const totalRounds = Math.ceil(Math.log2(size));
  const matches: TournamentMatch[] = [];
  const playerIdx = participants.findIndex(p => p.type === 'player');

  // Generate round 1 - random pairing
  const opponent = participants.find((_, i) => i !== playerIdx)!;
  matches.push({
    id: generateMatchId(1, 0),
    round: 1,
    player1: participants[playerIdx],
    player2: opponent,
  });

  return { format, size, matches, currentMatchIndex: 0, playerEliminated: false, playerWins: 0, playerLosses: 0, completed: false, round: 1 };
}

function findPlayerMatch(matches: TournamentMatch[]): number {
  return matches.findIndex(m =>
    !m.winner && (m.player1.type === 'player' || m.player2?.type === 'player')
  );
}

export function getNextPlayerMatch(tournament: Tournament): TournamentMatch | null {
  const idx = tournament.matches.findIndex(m =>
    !m.winner && (m.player1.type === 'player' || m.player2?.type === 'player')
  );
  if (idx === -1) return null;
  return tournament.matches[idx];
}

export function advanceTournament(
  tournament: Tournament,
  matchIndex: number,
  playerWon: boolean,
  playerScore: number,
  botScore: number,
  allBots: { type: 'player' | 'bot'; bot?: Bot; name: string }[]
): Tournament {
  const t = { ...tournament, matches: tournament.matches.map(m => ({ ...m })) };
  const match = t.matches[matchIndex];

  const isP1Player = match.player1.type === 'player';
  match.winner = (isP1Player && playerWon) || (!isP1Player && !playerWon) ? 'player1' : 'player2';
  match.score1 = isP1Player ? playerScore : botScore;
  match.score2 = isP1Player ? botScore : playerScore;

  if (playerWon) {
    t.playerWins++;
  } else {
    t.playerLosses++;
    if (t.format === 'single_elim') t.playerEliminated = true;
    if (t.format === 'double_elim' && t.playerLosses >= 2) t.playerEliminated = true;
  }

  // Simulate bot vs bot matches in same round
  t.matches.forEach((m, i) => {
    if (i === matchIndex || m.winner) return;
    if (m.player1.type === 'bot' && m.player2?.type === 'bot' && m.round === match.round) {
      const elo1 = m.player1.bot?.elo || 1000;
      const elo2 = m.player2.bot?.elo || 1000;
      const expected = 1 / (1 + Math.pow(10, (elo2 - elo1) / 400));
      m.winner = Math.random() < expected ? 'player1' : 'player2';
      m.score1 = m.winner === 'player1' ? 7 : Math.floor(Math.random() * 6);
      m.score2 = m.winner === 'player2' ? 7 : Math.floor(Math.random() * 6);
    }
  });

  // Advance winners to next round matches
  if (t.format === 'single_elim' || t.format === 'double_elim') {
    const currentRound = match.round;
    const roundMatches = t.matches.filter(m => m.round === currentRound && (m.bracket || 'winners') === (match.bracket || 'winners'));
    const allDone = roundMatches.every(m => m.winner);

    if (allDone) {
      const nextRoundMatches = t.matches.filter(m => m.round === currentRound + 1 && (m.bracket || 'winners') === (match.bracket || 'winners'));
      const winners = roundMatches.map(m => m.winner === 'player1' ? m.player1 : m.player2!);

      nextRoundMatches.forEach((nm, i) => {
        if (winners[i * 2]) nm.player1 = winners[i * 2];
        if (winners[i * 2 + 1]) nm.player2 = winners[i * 2 + 1];
      });
      t.round = currentRound + 1;
    }
  }

  // For round robin and swiss, generate next match
  if (t.format === 'round_robin' || t.format === 'swiss') {
    if (!t.playerEliminated) {
      const playedBotNames = new Set(t.matches.map(m => {
        if (m.player1.type === 'player') return m.player2?.name;
        if (m.player2?.type === 'player') return m.player1.name;
        return null;
      }).filter(Boolean));

      const availableBots = allBots.filter(b => b.type === 'bot' && !playedBotNames.has(b.name));
      const maxRounds = t.format === 'round_robin' ? t.size - 1 : Math.ceil(Math.log2(t.size));

      if (availableBots.length > 0 && t.matches.filter(m => m.winner).length < maxRounds) {
        const next = availableBots[Math.floor(Math.random() * availableBots.length)];
        t.matches.push({
          id: generateMatchId(t.round + 1, 0),
          round: t.round + 1,
          player1: { type: 'player', name: 'You' },
          player2: next,
        });
        t.round++;
      } else {
        t.completed = true;
      }
    }
  }

  // Check if tournament is complete
  const nextPlayerMatch = getNextPlayerMatch(t);
  if (!nextPlayerMatch || t.playerEliminated) {
    t.completed = true;
  }

  t.currentMatchIndex = t.matches.findIndex(m =>
    !m.winner && (m.player1.type === 'player' || m.player2?.type === 'player')
  );

  return t;
}

export function getTournamentSizes(format: TournamentFormat): number[] {
  if (format === 'round_robin') return [4, 6, 8];
  if (format === 'swiss') return [8, 16, 32];
  return [8, 16, 32];
}
