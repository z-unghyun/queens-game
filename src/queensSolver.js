/**
 * N-Queens puzzle generator.
 * Guarantees a DETERMINISTIC logical deduction path —
 * at every step, at least one row or column has exactly
 * one remaining valid position (like Sudoku naked singles).
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

/**
 * Check if the puzzle can be solved purely by constraint propagation:
 *   - If a ROW has exactly one remaining valid column → place queen
 *   - If a COLUMN has exactly one remaining valid row → place queen
 * Repeat until all queens are placed or no progress can be made.
 */
function isLogicallySolvable(n, hintQueens) {
  const possible = Array.from({ length: n }, () => new Uint8Array(n).fill(1));
  const queenInRow = new Uint8Array(n);
  const queenInCol = new Uint8Array(n);
  let placedCount = 0;

  function eliminate(r, c) {
    for (let j = 0; j < n; j++) possible[r][j] = 0;
    for (let i = 0; i < n; i++) possible[i][c] = 0;
    for (let d = 1; d < n; d++) {
      if (r + d < n && c + d < n) possible[r + d][c + d] = 0;
      if (r + d < n && c - d >= 0) possible[r + d][c - d] = 0;
      if (r - d >= 0 && c + d < n) possible[r - d][c + d] = 0;
      if (r - d >= 0 && c - d >= 0) possible[r - d][c - d] = 0;
    }
  }

  function place(r, c) {
    queenInRow[r] = 1;
    queenInCol[c] = 1;
    placedCount++;
    eliminate(r, c);
  }

  for (const [r, c] of hintQueens) place(r, c);

  let progress = true;
  while (progress) {
    progress = false;

    for (let r = 0; r < n; r++) {
      if (queenInRow[r]) continue;
      let count = 0, lastCol = -1;
      for (let c = 0; c < n; c++) {
        if (possible[r][c]) { count++; lastCol = c; }
      }
      if (count === 0) return false;
      if (count === 1) { place(r, lastCol); progress = true; }
    }

    for (let c = 0; c < n; c++) {
      if (queenInCol[c]) continue;
      let count = 0, lastRow = -1;
      for (let r = 0; r < n; r++) {
        if (possible[r][c]) { count++; lastRow = r; }
      }
      if (count === 0) return false;
      if (count === 1) { place(lastRow, c); progress = true; }
    }
  }

  return placedCount === n;
}

/**
 * Generate a puzzle with the fewest hints that remains
 * fully solvable by step-by-step logical deduction.
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
    if (isLogicallySolvable(n, candidateHints)) {
      hintSet = candidate;
    }
  }

  const hints = [...hintSet].map((i) => solution[i]);
  return { solution, hints };
}
