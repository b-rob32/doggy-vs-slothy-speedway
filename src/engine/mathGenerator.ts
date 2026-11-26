import {
  Difficulty,
  MathProblem,
  PlayerMathConfig,
  SingleOperation,
} from '../types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildChoices(
  answer: number,
  operation: SingleOperation,
  a: number,
  b: number
): number[] {
  const set = new Set<number>([answer]);
  const candidates: number[] = [];

  if (operation === 'multiplication') {
    candidates.push(
      answer + a,
      answer - a,
      answer + b,
      answer - b,
      answer + 1,
      answer - 1,
      answer + 2,
      answer - 2,
      answer + 10,
      answer - 10
    );
  } else if (operation === 'division') {
    candidates.push(
      answer + 1,
      answer - 1,
      answer + 2,
      answer - 2,
      answer + 3,
      answer - 3
    );
  } else {
    candidates.push(
      answer + 1,
      answer - 1,
      answer + 2,
      answer - 2,
      answer + 3,
      answer - 3,
      answer + 5,
      answer - 5,
      answer + 10,
      answer - 10
    );
  }

  const validCandidates = shuffle(
    candidates.filter((n) => Number.isInteger(n) && n >= 0 && n !== answer)
  );

  for (const c of validCandidates) {
    if (set.size >= 4) break;
    set.add(c);
  }

  let fallbackOffset = 1;
  while (set.size < 4) {
    const candidate = answer + fallbackOffset;
    if (candidate >= 0 && !set.has(candidate)) {
      set.add(candidate);
    }
    fallbackOffset = fallbackOffset > 0 ? -fallbackOffset : -fallbackOffset + 1;
  }

  return shuffle(Array.from(set));
}

function generateSingle(
  op: SingleOperation,
  difficulty: Difficulty,
  timesTableFocus: number | null
): MathProblem {
  let a = 1;
  let b = 1;
  let answer = 2;
  let symbol: '+' | '-' | '×' | '÷' = '+';

  if (op === 'addition') {
    symbol = '+';
    if (difficulty === 'easy') {
      // Friendly sums up to 10
      a = randInt(1, 6);
      b = randInt(1, Math.max(1, 10 - a));
    } else if (difficulty === 'medium') {
      // Sums up to 24
      a = randInt(3, 12);
      b = randInt(2, 12);
    } else {
      // Friendly 2-digit sums up to 65
      a = randInt(10, 35);
      b = randInt(8, 30);
    }
    answer = a + b;
  } else if (op === 'subtraction') {
    symbol = '-';
    if (difficulty === 'easy') {
      // Numbers up to 10, never negative
      a = randInt(2, 10);
      b = randInt(1, a);
    } else if (difficulty === 'medium') {
      // Numbers up to 18
      a = randInt(6, 18);
      b = randInt(2, Math.min(a, 12));
    } else {
      // Numbers up to 50
      a = randInt(15, 50);
      b = randInt(5, Math.min(a - 1, 30));
    }
    answer = a - b;
  } else if (op === 'multiplication') {
    symbol = '×';
    if (timesTableFocus && timesTableFocus >= 2 && timesTableFocus <= 12) {
      const maxOther = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12;
      const other = randInt(1, maxOther);
      if (Math.random() < 0.5) {
        a = timesTableFocus;
        b = other;
      } else {
        a = other;
        b = timesTableFocus;
      }
    } else if (difficulty === 'easy') {
      a = randInt(1, 4);
      b = randInt(1, 5);
    } else if (difficulty === 'medium') {
      a = randInt(2, 8);
      b = randInt(2, 8);
    } else {
      a = randInt(2, 11);
      b = randInt(2, 11);
    }
    answer = a * b;
  } else {
    // division — always clean whole-number answers!
    symbol = '÷';
    if (difficulty === 'easy') {
      b = randInt(1, 4);
      answer = randInt(1, 4);
    } else if (difficulty === 'medium') {
      b = randInt(2, 8);
      answer = randInt(2, 8);
    } else {
      b = randInt(2, 10);
      answer = randInt(2, 10);
    }
    a = b * answer;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    a,
    b,
    operation: op,
    symbol,
    answer,
    choices: buildChoices(answer, op, a, b),
  };
}

export function generateProblem(
  config: PlayerMathConfig,
  lastPrompt?: string
): MathProblem {
  const ops: SingleOperation[] = [
    'addition',
    'subtraction',
    'multiplication',
    'division',
  ];

  for (let attempt = 0; attempt < 6; attempt++) {
    const op: SingleOperation =
      config.operation === 'mixed'
        ? ops[randInt(0, ops.length - 1)]
        : config.operation;

    const focus = op === 'multiplication' ? config.timesTableFocus : null;
    const problem = generateSingle(op, config.difficulty, focus);
    const prompt = `${problem.a} ${problem.symbol} ${problem.b}`;
    if (prompt !== lastPrompt) {
      return problem;
    }
  }

  const fallbackOp: SingleOperation =
    config.operation === 'mixed' ? 'addition' : config.operation;
  return generateSingle(fallbackOp, config.difficulty, config.timesTableFocus);
}

export function formatOperationLabel(op: string): string {
  switch (op) {
    case 'addition':
      return 'Addition (+)';
    case 'subtraction':
      return 'Subtraction (−)';
    case 'multiplication':
      return 'Multiplication (×)';
    case 'division':
      return 'Division (÷)';
    case 'mixed':
      return 'Mixed All';
    default:
      return op;
  }
}
