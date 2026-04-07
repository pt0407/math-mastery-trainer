import { Difficulty } from "./rankings";

export type Subject = 'basic' | 'algebra' | 'algebra2' | 'geometry' | 'chemistry';

export interface Question {
  question: string;
  answer: number;
  choices: number[]; // 4 multiple choice options
  hint?: string;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function dScale(base: number, d: Difficulty, mult = 1): number {
  const s = d === 'easy' ? 0.5 : d === 'medium' ? 1 : 2;
  return Math.max(2, Math.round(base * s * mult));
}

// Generate plausible wrong answers near the correct one
function generateChoices(answer: number): number[] {
  const choices = new Set<number>([answer]);
  const isInt = Number.isInteger(answer);
  const magnitude = Math.max(1, Math.abs(answer));

  let attempts = 0;
  while (choices.size < 4 && attempts < 50) {
    attempts++;
    let wrong: number;
    const strategy = rand(0, 3);

    if (strategy === 0) {
      // Close offset
      const offset = rand(1, Math.max(1, Math.ceil(magnitude * 0.3)));
      wrong = answer + (Math.random() < 0.5 ? offset : -offset);
    } else if (strategy === 1) {
      // Percentage offset
      const pct = (rand(5, 30)) / 100;
      wrong = Math.round(answer * (1 + (Math.random() < 0.5 ? pct : -pct)));
    } else if (strategy === 2) {
      // Common mistakes (off by 1, doubled, halved)
      const transforms = [answer + 1, answer - 1, answer * 2, Math.floor(answer / 2), answer + 10, answer - 10];
      wrong = pick(transforms);
    } else {
      // Random in range
      wrong = answer + rand(-Math.max(3, Math.ceil(magnitude * 0.5)), Math.max(3, Math.ceil(magnitude * 0.5)));
    }

    if (isInt) wrong = Math.round(wrong);
    if (wrong !== answer && !choices.has(wrong)) choices.add(wrong);
  }

  // Fallback if we couldn't generate enough
  while (choices.size < 4) {
    const w = answer + (choices.size * 2 + 1);
    choices.add(w);
  }

  // Shuffle
  const arr = Array.from(choices);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function withChoices(q: { question: string; answer: number; hint?: string }): Question {
  return { ...q, choices: generateChoices(q.answer) };
}

function generateBasicMath(d: Difficulty): Question {
  const type = rand(0, 3);
  if (type === 0) {
    const max = d === 'easy' ? 12 : d === 'medium' ? 50 : 99;
    const a = rand(2, max), b = rand(2, max);
    return withChoices({ question: `${a} × ${b}`, answer: a * b });
  } else if (type === 1) {
    const max = d === 'easy' ? 100 : d === 'medium' ? 500 : 999;
    const a = rand(10, max), b = rand(10, max);
    return withChoices({ question: `${a} + ${b}`, answer: a + b });
  } else if (type === 2) {
    const max = d === 'easy' ? 100 : d === 'medium' ? 500 : 999;
    const a = rand(50, max), b = rand(10, a);
    return withChoices({ question: `${a} − ${b}`, answer: a - b });
  } else {
    const bMax = d === 'easy' ? 10 : d === 'medium' ? 12 : 15;
    const b = rand(2, bMax), answer = rand(2, dScale(25, d));
    const a = b * answer;
    return withChoices({ question: `${a} ÷ ${b}`, answer });
  }
}

function generateAlgebra(d: Difficulty): Question {
  const type = rand(0, 2);
  if (type === 0) {
    const xRange = d === 'easy' ? 5 : d === 'medium' ? 10 : 20;
    const x = rand(-xRange, xRange);
    const a = rand(2, d === 'hard' ? 15 : 9);
    const b = rand(-20, 20);
    const c = a * x + b;
    return withChoices({ question: `${a}x + ${b >= 0 ? b : `(${b})`} = ${c}\nSolve for x`, answer: x });
  } else if (type === 1) {
    const m = rand(-5, 5);
    const x1 = rand(-5, 5);
    const x2 = x1 + rand(1, 4);
    const y1 = rand(-10, 10);
    const y2 = y1 + m * (x2 - x1);
    return withChoices({ question: `Slope through (${x1}, ${y1}) and (${x2}, ${y2})`, answer: m });
  } else {
    const x = rand(1, d === 'hard' ? 10 : 6);
    const a = rand(1, d === 'hard' ? 8 : 5), b = rand(-10, 10);
    return withChoices({ question: `f(x) = ${a}x² + ${b >= 0 ? b : `(${b})`}\nf(${x}) = ?`, answer: a * x * x + b });
  }
}

function generateAlgebra2(d: Difficulty): Question {
  const type = rand(0, 2);
  if (type === 0) {
    const range = d === 'easy' ? 5 : d === 'medium' ? 8 : 12;
    const p = rand(-range, range), q = rand(-range, range);
    return withChoices({ question: `(x − ${p >= 0 ? p : `(${p})`})(x − ${q >= 0 ? q : `(${q})`}) = 0\nSum of roots?`, answer: p + q });
  } else if (type === 1) {
    const base = pick([2, 3, 5, 10]);
    const exp = rand(1, d === 'hard' ? 6 : 4);
    const val = Math.pow(base, exp);
    return withChoices({ question: `log₍${base}₎(${val}) = ?`, answer: exp });
  } else {
    const a = rand(2, 5);
    const m = rand(1, d === 'hard' ? 6 : 4), n = rand(1, d === 'hard' ? 6 : 4);
    return withChoices({ question: `Simplify: ${a}^${m} × ${a}^${n}\nWhat is the exponent?`, answer: m + n, hint: `a^m × a^n = a^(m+n)` });
  }
}

function generateGeometry(d: Difficulty): Question {
  const type = rand(0, 3);
  if (type === 0) {
    const r = rand(1, d === 'hard' ? 25 : 15);
    const area = Math.round(Math.PI * r * r);
    return withChoices({ question: `Area of circle, r = ${r}\n(round to nearest integer)`, answer: area });
  } else if (type === 1) {
    const max = d === 'easy' ? 10 : d === 'medium' ? 20 : 30;
    const a = rand(3, max), b = rand(3, max);
    return withChoices({ question: `Area of triangle\nbase = ${a}, height = ${b}`, answer: (a * b) / 2 });
  } else if (type === 2) {
    const triples = [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[6,8,10]];
    const [a, b, c] = pick(triples);
    const k = rand(1, d === 'hard' ? 5 : 3);
    return withChoices({ question: `Right triangle: a = ${a*k}, b = ${b*k}\nFind c`, answer: c * k });
  } else {
    const n = rand(3, d === 'hard' ? 12 : 8);
    return withChoices({ question: `Sum of interior angles\nof a ${n}-sided polygon`, answer: (n - 2) * 180 });
  }
}

function generateChemistry(d: Difficulty): Question {
  const type = rand(0, 2);
  if (type === 0) {
    const elements: [string, number, number][] = [
      ['H₂O', 18, 1], ['CO₂', 44, 1], ['NaCl', 58, 1],
      ['O₂', 32, 1], ['N₂', 28, 1], ['CH₄', 16, 1],
      ['C₆H₁₂O₆', 180, 1], ['H₂SO₄', 98, 1], ['CaCO₃', 100, 1],
    ];
    const [name, mass] = pick(elements);
    const n = rand(1, d === 'hard' ? 10 : 5);
    return withChoices({ question: `Mass of ${n} mol of ${name}?\n(molar mass = ${mass} g/mol)`, answer: n * mass });
  } else if (type === 1) {
    const exp = rand(1, d === 'hard' ? 10 : 6);
    return withChoices({ question: `pH of a solution with\n[H⁺] = 10⁻${exp} M`, answer: exp });
  } else {
    const eqs: [string, number][] = [
      ['_H₂ + O₂ → 2H₂O\nCoefficient of H₂?', 2],
      ['_N₂ + 3H₂ → 2NH₃\nCoefficient of N₂?', 1],
      ['2H₂O₂ → _H₂O + O₂\nCoefficient of H₂O?', 2],
      ['CH₄ + _O₂ → CO₂ + 2H₂O\nCoefficient of O₂?', 2],
    ];
    const [q, a] = pick(eqs);
    return withChoices({ question: q, answer: a });
  }
}

export function generateQuestion(subject: Subject, difficulty: Difficulty = 'medium'): Question {
  switch (subject) {
    case 'basic': return generateBasicMath(difficulty);
    case 'algebra': return generateAlgebra(difficulty);
    case 'algebra2': return generateAlgebra2(difficulty);
    case 'geometry': return generateGeometry(difficulty);
    case 'chemistry': return generateChemistry(difficulty);
  }
}

export const subjectInfo: Record<Subject, { label: string; emoji: string; color: string }> = {
  basic: { label: 'Basic Math', emoji: '🔢', color: 'primary' },
  algebra: { label: 'Algebra', emoji: '📐', color: 'primary' },
  algebra2: { label: 'Algebra 2', emoji: '📊', color: 'primary' },
  geometry: { label: 'Geometry', emoji: '📏', color: 'primary' },
  chemistry: { label: 'Chemistry', emoji: '⚗️', color: 'primary' },
};
