import { Subject } from "./questions";

export interface Step {
  prompt: string;
  answer: number;
  hint?: string;
}

export interface StepByStepProblem {
  title: string;
  steps: Step[];
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBasicSteps(): StepByStepProblem {
  const type = rand(0, 1);
  if (type === 0) {
    // Multi-step arithmetic: a × b + c × d
    const a = rand(3, 12), b = rand(3, 12), c = rand(2, 9), d = rand(2, 9);
    return {
      title: `Solve: ${a} × ${b} + ${c} × ${d}`,
      steps: [
        { prompt: `Step 1: What is ${a} × ${b}?`, answer: a * b },
        { prompt: `Step 2: What is ${c} × ${d}?`, answer: c * d },
        { prompt: `Step 3: What is ${a * b} + ${c * d}?`, answer: a * b + c * d },
      ],
    };
  } else {
    // Order of operations: (a + b) × c - d
    const a = rand(5, 20), b = rand(5, 20), c = rand(2, 8), d = rand(1, 30);
    return {
      title: `Solve: (${a} + ${b}) × ${c} − ${d}`,
      steps: [
        { prompt: `Step 1: What is ${a} + ${b}?`, answer: a + b },
        { prompt: `Step 2: What is ${a + b} × ${c}?`, answer: (a + b) * c },
        { prompt: `Step 3: What is ${(a + b) * c} − ${d}?`, answer: (a + b) * c - d },
      ],
    };
  }
}

function generateAlgebraSteps(): StepByStepProblem {
  // Solve ax + b = c step by step
  const x = rand(-8, 8);
  const a = rand(2, 7);
  const b = rand(-15, 15);
  const c = a * x + b;
  return {
    title: `Solve for x: ${a}x + ${b >= 0 ? b : `(${b})`} = ${c}`,
    steps: [
      { prompt: `Step 1: Subtract ${b >= 0 ? b : `(${b})`} from both sides.\nWhat is ${c} − ${b >= 0 ? b : `(${b})`}?`, answer: c - b, hint: `${c} − ${b} = ${c - b}` },
      { prompt: `Step 2: Now ${a}x = ${c - b}.\nDivide both sides by ${a}.\nWhat is x?`, answer: x, hint: `${c - b} ÷ ${a} = ${x}` },
    ],
  };
}

function generateAlgebra2Steps(): StepByStepProblem {
  // Completing the square: x² + bx + c = 0
  const p = rand(1, 6), q = rand(1, 6);
  const b = -(p + q);
  const c = p * q;
  return {
    title: `Factor: x² + ${b >= 0 ? b : `(${b})`}x + ${c}`,
    steps: [
      { prompt: `Step 1: Find two numbers that multiply to ${c} and add to ${b}.\nWhat is the first number (smaller)?`, answer: Math.min(-p, -q) },
      { prompt: `Step 2: What is the second number?`, answer: Math.max(-p, -q) },
      { prompt: `Step 3: The factored form is (x + a)(x + b).\nWhat is the sum of the roots (with sign change)?`, answer: p + q },
    ],
  };
}

function generateGeometrySteps(): StepByStepProblem {
  const type = rand(0, 1);
  if (type === 0) {
    // Area of composite shape: rectangle + triangle
    const w = rand(4, 12), h = rand(3, 8), triH = rand(2, 6);
    return {
      title: `Find the total area:\nRectangle ${w}×${h} with a triangle on top (base ${w}, height ${triH})`,
      steps: [
        { prompt: `Step 1: Area of the rectangle (${w} × ${h})?`, answer: w * h },
        { prompt: `Step 2: Area of the triangle (base ${w}, height ${triH})?\nUse: ½ × base × height`, answer: (w * triH) / 2 },
        { prompt: `Step 3: Total area?`, answer: w * h + (w * triH) / 2 },
      ],
    };
  } else {
    // Pythagorean theorem step by step
    const a = rand(3, 12), b = rand(3, 12);
    const cSq = a * a + b * b;
    const c = Math.round(Math.sqrt(cSq) * 100) / 100;
    return {
      title: `Right triangle: a = ${a}, b = ${b}. Find c.`,
      steps: [
        { prompt: `Step 1: What is a² = ${a}²?`, answer: a * a },
        { prompt: `Step 2: What is b² = ${b}²?`, answer: b * b },
        { prompt: `Step 3: What is a² + b² = ${a * a} + ${b * b}?`, answer: cSq },
      ],
    };
  }
}

function generateChemistrySteps(): StepByStepProblem {
  // Dilution: M1V1 = M2V2
  const m1 = rand(2, 10);
  const v1 = rand(50, 200);
  const v2 = rand(300, 1000);
  const m2Product = m1 * v1;
  const m2 = Math.round((m2Product / v2) * 100) / 100;
  return {
    title: `Dilution: ${m1}M solution, ${v1}mL diluted to ${v2}mL.\nFind final molarity.`,
    steps: [
      { prompt: `Step 1: Calculate M₁ × V₁\n${m1} × ${v1} = ?`, answer: m1 * v1 },
      { prompt: `Step 2: M₂ = M₁V₁ ÷ V₂\n${m1 * v1} ÷ ${v2} = ?\n(round to 2 decimals)`, answer: m2 },
    ],
  };
}

export function generateStepByStep(subject: Subject): StepByStepProblem {
  switch (subject) {
    case 'basic': return generateBasicSteps();
    case 'algebra': return generateAlgebraSteps();
    case 'algebra2': return generateAlgebra2Steps();
    case 'geometry': return generateGeometrySteps();
    case 'chemistry': return generateChemistrySteps();
  }
}
