import { useState } from "react";
import SubjectSelect from "@/components/SubjectSelect";
import GameRound from "@/components/GameRound";
import Results from "@/components/Results";
import { Subject } from "@/lib/questions";

type Screen = 'select' | 'playing' | 'results';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('select');
  const [subject, setSubject] = useState<Subject>('basic');
  const [results, setResults] = useState({ score: 0, total: 10, avgTime: 0 });

  const handleSelect = (s: Subject) => {
    setSubject(s);
    setScreen('playing');
  };

  const handleFinish = (score: number, total: number, avgTime: number) => {
    setResults({ score, total, avgTime });
    setScreen('results');
  };

  if (screen === 'select') return <SubjectSelect onSelect={handleSelect} />;
  if (screen === 'playing') return <GameRound subject={subject} onFinish={handleFinish} onBack={() => setScreen('select')} />;
  return (
    <Results
      {...results}
      onReplay={() => setScreen('playing')}
      onHome={() => setScreen('select')}
    />
  );
};

export default Index;
