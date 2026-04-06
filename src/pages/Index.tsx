import { useState } from "react";
import SubjectSelect, { GameMode } from "@/components/SubjectSelect";
import GameRound from "@/components/GameRound";
import Results from "@/components/Results";
import StepByStepMode from "@/components/StepByStepMode";
import VsBotMode from "@/components/VsBotMode";
import { Subject } from "@/lib/questions";
import {
  Difficulty,
  loadStats,
  saveStats,
  calculatePoints,
  checkPrestige,
  PlayerStats,
} from "@/lib/rankings";

type Screen = 'select' | 'playing' | 'vsbot' | 'stepbystep' | 'results';

interface ResultsData {
  score: number;
  total: number;
  avgTime: number;
  pointsEarned: number;
  stats: PlayerStats;
  botScore?: number;
  botWin?: boolean;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>('select');
  const [subject, setSubject] = useState<Subject>('basic');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [results, setResults] = useState<ResultsData>({
    score: 0, total: 10, avgTime: 0, pointsEarned: 0, stats: loadStats(),
  });

  const handleStart = (s: Subject, d: Difficulty, mode: GameMode) => {
    setSubject(s);
    setDifficulty(d);
    if (mode === 'stepbystep') {
      setScreen('stepbystep');
    } else if (mode === 'vsbot') {
      setScreen('vsbot');
    } else {
      setScreen('playing');
    }
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
    setResults({ score, total, avgTime, pointsEarned: pts, stats });
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
    setResults({ score: playerScore, total, avgTime, pointsEarned: pts, stats, botScore, botWin: won });
    setScreen('results');
  };

  if (screen === 'select') return <SubjectSelect onStart={handleStart} />;
  if (screen === 'stepbystep') return <StepByStepMode subject={subject} onBack={() => setScreen('select')} />;
  if (screen === 'vsbot') return (
    <VsBotMode
      subject={subject}
      difficulty={difficulty}
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
      onReplay={() => setScreen(results.botScore !== undefined ? 'vsbot' : 'playing')}
      onHome={() => setScreen('select')}
    />
  );
};

export default Index;
