/**
 * N-Queens puzzle generator with unique-solution guarantee.
 * Uses randomized backtracking + iterative hint minimization.
 */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function solveNQueens(n) {
  const queens = [];
  const cols = new Set();
  const diag1 = new Set();
  const diag2 = new Set();

  function solve(row) {
    if (row === n) return true;
    const columns = shuffle([...Array(n).keys()]);
    for (const col of columns) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue;
      cols.add(col);
      diag1.add(row - col);
      diag2.add(row + col);
      queens.push([row, col]);
      if (solve(row + 1)) return true;
      queens.pop();
      cols.delete(col);
      diag1.delete(row - col);
      diag2.delete(row + col);
    }
    return false;
  }

  solve(0);
  return queens;
}

function countCompletions(n, fixedQueens, limit) {
  const fixedRows = new Map();
  for (const [r, c] of fixedQueens) {
    fixedRows.set(r, c);
  }

  const cols = new Set(fixedQueens.map(([, c]) => c));
  const d1 = new Set(fixedQueens.map(([r, c]) => r - c));
  const d2 = new Set(fixedQueens.map(([r, c]) => r + c));

  let count = 0;
  let iterations = 0;
  const MAX_ITER = 200000;

  function solve(row) {
    if (count >= limit || iterations >= MAX_ITER) return;
    if (row === n) {
      count++;
      return;
    }
    iterations++;

    if (fixedRows.has(row)) {
      solve(row + 1);
      return;
    }

    for (let col = 0; col < n; col++) {
      if (cols.has(col) || d1.has(row - col) || d2.has(row + col)) continue;
      cols.add(col);
      d1.add(row - col);
      d2.add(row + col);
      solve(row + 1);
      cols.delete(col);
      d1.delete(row - col);
      d2.delete(row + col);
    }
  }

  solve(0);
  return iterations >= MAX_ITER ? limit : count;
}

/**
 * Generate a puzzle with the minimum number of hint queens
 * that still guarantees a unique solution (like Sudoku).
 */
export function generatePuzzle(n) {
  const solution = solveNQueens(n);

  let hintSet = new Set(Array.from({ length: n }, (_, i) => i));
  const order = shuffle([...Array(n).keys()]);

  for (const idx of order) {
    if (!hintSet.has(idx)) continue;

    const candidate = new Set(hintSet);
    candidate.delete(idx);

    const candidateHints = [...candidate].map((i) => solution[i]);
    if (countCompletions(n, candidateHints, 2) === 1) {
      hintSet = candidate;
    }
  }

  const hintIndices = [...hintSet];
  const hints = hintIndices.map((i) => solution[i]);
  return { solution, hints };
}
