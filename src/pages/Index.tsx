import { useState } from "react";
import SubjectSelect, { GameMode } from "@/components/SubjectSelect";
import GameRound from "@/components/GameRound";
import Results from "@/components/Results";
import StepByStepMode from "@/components/StepByStepMode";
import VsBotMode from "@/components/VsBotMode";
import TournamentMode from "@/components/TournamentMode";
import StatsPage from "@/components/StatsPage";
import AuthScreen from "@/components/AuthScreen";
import { Subject } from "@/lib/questions";
import {
  Difficulty,
  loadStats,
  saveStats,
  calculatePoints,
  checkPrestige,
  PlayerStats,
} from "@/lib/rankings";
import {
  loadProfile,
  saveProfile,
  calculateEloChange,
  getPerformanceMultiplier,
  GameModeKey,
} from "@/lib/elo";
import { loadBots, findOpponent, updateBotsAfterMatch, Bot } from "@/lib/bots";
import { TournamentFormat } from "@/lib/tournament";
import { getSession, logout } from "@/lib/auth";

type Screen = 'select' | 'playing' | 'vsbot' | 'stepbystep' | 'tournament' | 'results' | 'stats';

interface ResultsData {
  score: number;
  total: number;
  avgTime: number;
  pointsEarned: number;
  stats: PlayerStats;
  botScore?: number;
  botWin?: boolean;
  eloChange?: number;
  mode?: GameModeKey;
}

const Index = () => {
  const [user, setUser] = useState<string | null>(getSession());
  const [screen, setScreen] = useState<Screen>('select');
  const [subject, setSubject] = useState<Subject>('basic');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [opponent, setOpponent] = useState<Bot | null>(null);
  const [results, setResults] = useState<ResultsData>({
    score: 0, total: 10, avgTime: 0, pointsEarned: 0, stats: loadStats(),
  });

  if (!user) {
    return <AuthScreen onAuth={(username) => setUser(username)} />;
  }

  const handleStart = (s: Subject, d: Difficulty, mode: GameMode) => {
    setSubject(s);
    setDifficulty(d);
    if (mode === 'stepbystep') {
      setScreen('stepbystep');
    } else if (mode === 'vsbot') {
      const bots = loadBots();
      const profile = loadProfile();
      const opp = findOpponent(bots, profile.elo.vsbot);
      setOpponent(opp);
      setScreen('vsbot');
    } else if (mode === 'tournament') {
      setScreen('tournament');
    } else {
      setScreen('playing');
    }
  };

  const updateModeStats = (mode: GameModeKey, score: number, total: number, avgTime: number, won: boolean) => {
    const profile = loadProfile();
    const ms = profile.modeStats[mode];
    ms.gamesPlayed++;
    ms.totalCorrect += score;
    ms.totalQuestions += total;
    ms.totalTimeSec += avgTime * total;
    if (won) {
      ms.wins++;
      ms.currentStreak++;
      ms.bestStreak = Math.max(ms.bestStreak, ms.currentStreak);
    } else {
      ms.losses++;
      ms.currentStreak = 0;
    }
    profile.overallGames++;
    return profile;
  };

  const handleFinish = (score: number, total: number, avgTime: number) => {
    const pts = calculatePoints(score, total, avgTime, difficulty);
    let stats = loadStats();
    stats.totalPoints += pts;
    stats.gamesPlayed += 1;
    stats.questionsAnswered += total;
    stats.correctAnswers += score;
    stats.totalTimeSec += avgTime * total;
    stats = checkPrestige(stats);
    saveStats(stats);

    const profile = updateModeStats('practice', score, total, avgTime, score >= total / 2);
    const perfMult = getPerformanceMultiplier(score / total, avgTime);
    const eloChange = calculateEloChange(profile.elo.practice, 1000, score >= total / 2, perfMult);
    profile.elo.practice = Math.max(100, profile.elo.practice + eloChange);
    profile.totalPoints += pts;
    saveProfile(profile);

    setResults({ score, total, avgTime, pointsEarned: pts, stats, eloChange, mode: 'practice' });
    setScreen('results');
  };

  const handleBotFinish = (playerScore: number, botScore: number, total: number, avgTime: number, won: boolean) => {
    const pts = calculatePoints(playerScore, total, avgTime, difficulty, won);
    let stats = loadStats();
    stats.totalPoints += pts;
    stats.gamesPlayed += 1;
    stats.questionsAnswered += total;
    stats.correctAnswers += playerScore;
    stats.totalTimeSec += avgTime * total;
    if (won) stats.botWins += 1;
    else stats.botLosses += 1;
    stats = checkPrestige(stats);
    saveStats(stats);

    const profile = updateModeStats('vsbot', playerScore, total, avgTime, won);
    const perfMult = getPerformanceMultiplier(playerScore / total, avgTime);
    const eloChange = calculateEloChange(profile.elo.vsbot, opponent?.elo || 100, won, perfMult);
    profile.elo.vsbot = Math.max(100, profile.elo.vsbot + eloChange);
    profile.totalPoints += pts;
    saveProfile(profile);

    if (opponent) {
      const bots = loadBots();
      updateBotsAfterMatch(bots, opponent.id, won, profile.elo.vsbot);
    }

    setResults({ score: playerScore, total, avgTime, pointsEarned: pts, stats, botScore, botWin: won, eloChange, mode: 'vsbot' });
    setScreen('results');
  };

  const handleTournamentFinish = (wins: number, losses: number, format: TournamentFormat) => {
    const profile = updateModeStats('tournament', wins, wins + losses, 0, wins > losses);
    const perfMult = wins / Math.max(1, wins + losses);
    const eloChange = calculateEloChange(profile.elo.tournament, 800, wins > losses, perfMult);
    profile.elo.tournament = Math.max(100, profile.elo.tournament + eloChange);
    saveProfile(profile);

    const stats = loadStats();
    setResults({ score: wins, total: wins + losses, avgTime: 0, pointsEarned: 0, stats, eloChange, mode: 'tournament' });
    setScreen('results');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (screen === 'select') return <SubjectSelect onStart={handleStart} onStats={() => setScreen('stats')} onLogout={handleLogout} username={user} />;
  if (screen === 'stats') return <StatsPage onBack={() => setScreen('select')} />;
  if (screen === 'stepbystep') return <StepByStepMode subject={subject} onBack={() => setScreen('select')} />;
  if (screen === 'tournament') return (
    <TournamentMode
      subject={subject}
      difficulty={difficulty}
      onFinish={handleTournamentFinish}
      onBack={() => setScreen('select')}
    />
  );
  if (screen === 'vsbot' && opponent) return (
    <VsBotMode
      subject={subject}
      difficulty={difficulty}
      opponent={opponent}
      onFinish={handleBotFinish}
      onBack={() => setScreen('select')}
    />
  );
  if (screen === 'playing') return (
    <GameRound
      subject={subject}
      difficulty={difficulty}
      onFinish={handleFinish}
      onBack={() => setScreen('select')}
    />
  );
  return (
    <Results
      {...results}
      onReplay={() => {
        if (results.mode === 'tournament') setScreen('tournament');
        else if (results.botScore !== undefined) {
          const bots = loadBots();
          const profile = loadProfile();
          setOpponent(findOpponent(bots, profile.elo.vsbot));
          setScreen('vsbot');
        } else setScreen('playing');
      }}
      onHome={() => setScreen('select')}
    />
  );
};

export default Index;
