/**
 * Randomized backtracking solver for the N-Queens problem.
 * Returns an array of [row, col] pairs representing queen positions.
 */
export function solveNQueens(n) {
  const queens = [];
  const cols = new Set();
  const diag1 = new Set();
  const diag2 = new Set();

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

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
