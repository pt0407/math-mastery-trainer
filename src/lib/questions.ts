export type Subject = 'basic' | 'algebra' | 'algebra2' | 'geometry' | 'chemistry';

export interface Question {
  question: string;
  answer: number;
  hint?: string;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBasicMath(): Question {
  const type = rand(0, 3);
  if (type === 0) {
    const a = rand(2, 99), b = rand(2, 99);
    return { question: `${a} × ${b}`, answer: a * b };
  } else if (type === 1) {
    const a = rand(10, 999), b = rand(10, 999);
    return { question: `${a} + ${b}`, answer: a + b };
  } else if (type === 2) {
    const a = rand(100, 999), b = rand(10, a);
    return { question: `${a} − ${b}`, answer: a - b };
  } else {
    const b = rand(2, 12), answer = rand(2, 25);
    const a = b * answer;
    return { question: `${a} ÷ ${b}`, answer };
  }
}

function generateAlgebra(): Question {
  const type = rand(0, 2);
  if (type === 0) {
    // ax + b = c, solve for x
    const x = rand(-10, 10);
    const a = rand(2, 9);
    const b = rand(-20, 20);
    const c = a * x + b;
    return { question: `${a}x + ${b >= 0 ? b : `(${b})`} = ${c}\nSolve for x`, answer: x };
  } else if (type === 1) {
    // what is the slope? (y2-y1)/(x2-x1)
    const m = rand(-5, 5);
    const x1 = rand(-5, 5);
    const x2 = x1 + rand(1, 4);
    const y1 = rand(-10, 10);
    const y2 = y1 + m * (x2 - x1);
    return { question: `Slope through (${x1}, ${y1}) and (${x2}, ${y2})`, answer: m };
  } else {
    // evaluate expression
    const x = rand(1, 6);
    const a = rand(1, 5), b = rand(-10, 10);
    return { question: `f(x) = ${a}x² + ${b >= 0 ? b : `(${b})`}\nf(${x}) = ?`, answer: a * x * x + b };
  }
}

function generateAlgebra2(): Question {
  const type = rand(0, 2);
  if (type === 0) {
    // Quadratic: (x-p)(x-q) what is p+q (sum of roots)
    const p = rand(-8, 8), q = rand(-8, 8);
    return { question: `(x − ${p >= 0 ? p : `(${p})`})(x − ${q >= 0 ? q : `(${q})`}) = 0\nSum of roots?`, answer: p + q };
  } else if (type === 1) {
    // log base
    const base = pick([2, 3, 5, 10]);
    const exp = rand(1, 4);
    const val = Math.pow(base, exp);
    return { question: `log₍${base}₎(${val}) = ?`, answer: exp };
  } else {
    // exponent rules: a^m * a^n
    const a = rand(2, 5);
    const m = rand(1, 4), n = rand(1, 4);
    return { question: `Simplify: ${a}^${m} × ${a}^${n}\nWhat is the exponent?`, answer: m + n, hint: `a^m × a^n = a^(m+n)` };
  }
}

function generateGeometry(): Question {
  const type = rand(0, 3);
  if (type === 0) {
    const r = rand(1, 15);
    const area = Math.round(Math.PI * r * r);
    return { question: `Area of circle, r = ${r}\n(round to nearest integer)`, answer: area };
  } else if (type === 1) {
    const a = rand(3, 20), b = rand(3, 20);
    return { question: `Area of triangle\nbase = ${a}, height = ${b}`, answer: (a * b) / 2 };
  } else if (type === 2) {
    // Pythagorean
    const triples = [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[6,8,10]];
    const [a, b, c] = pick(triples);
    const k = rand(1, 3);
    return { question: `Right triangle: a = ${a*k}, b = ${b*k}\nFind c`, answer: c * k };
  } else {
    const n = rand(3, 8);
    return { question: `Sum of interior angles\nof a ${n}-sided polygon`, answer: (n - 2) * 180 };
  }
}

function generateChemistry(): Question {
  const type = rand(0, 2);
  if (type === 0) {
    // Molar mass quick calc
    const elements: [string, number, number][] = [
      ['H₂O', 18, 1], ['CO₂', 44, 1], ['NaCl', 58, 1],
      ['O₂', 32, 1], ['N₂', 28, 1], ['CH₄', 16, 1],
      ['C₆H₁₂O₆', 180, 1], ['H₂SO₄', 98, 1], ['CaCO₃', 100, 1],
    ];
    const [name, mass, moles] = pick(elements);
    const n = rand(1, 5);
    return { question: `Mass of ${n} mol of ${name}?\n(molar mass = ${mass} g/mol)`, answer: n * mass };
  } else if (type === 1) {
    // pH
    const exp = rand(1, 6);
    return { question: `pH of a solution with\n[H⁺] = 10⁻${exp} M`, answer: exp };
  } else {
    // Balancing simple: coefficient
    const eqs: [string, number][] = [
      ['_H₂ + O₂ → 2H₂O\nCoefficient of H₂?', 2],
      ['_N₂ + 3H₂ → 2NH₃\nCoefficient of N₂?', 1],
      ['2H₂O₂ → _H₂O + O₂\nCoefficient of H₂O?', 2],
      ['CH₄ + _O₂ → CO₂ + 2H₂O\nCoefficient of O₂?', 2],
    ];
    const [q, a] = pick(eqs);
    return { question: q, answer: a };
  }
}

export function generateQuestion(subject: Subject): Question {
  switch (subject) {
    case 'basic': return generateBasicMath();
    case 'algebra': return generateAlgebra();
    case 'algebra2': return generateAlgebra2();
    case 'geometry': return generateGeometry();
    case 'chemistry': return generateChemistry();
  }
}

export const subjectInfo: Record<Subject, { label: string; emoji: string; color: string }> = {
  basic: { label: 'Basic Math', emoji: '🔢', color: 'primary' },
  algebra: { label: 'Algebra', emoji: '📐', color: 'primary' },
  algebra2: { label: 'Algebra 2', emoji: '📊', color: 'primary' },
  geometry: { label: 'Geometry', emoji: '📏', color: 'primary' },
  chemistry: { label: 'Chemistry', emoji: '⚗️', color: 'primary' },
};
