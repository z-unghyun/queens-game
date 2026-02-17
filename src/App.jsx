import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { solveNQueens } from './queensSolver';

const GRID_MAX = 480;
const CELL_EMPTY = 0;
const CELL_QUEEN = 1;
const CELL_MARKED = 2;
const CELL_INITIAL = 3;

function getConflicts(board, n) {
  const queens = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (board[i][j] === CELL_QUEEN || board[i][j] === CELL_INITIAL) {
        queens.push([i, j]);
      }
    }
  }

  const conflictCells = new Set();
  for (let a = 0; a < queens.length; a++) {
    for (let b = a + 1; b < queens.length; b++) {
      const [r1, c1] = queens[a];
      const [r2, c2] = queens[b];
      if (r1 === r2 || c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
        conflictCells.add(`${r1},${c1}`);
        conflictCells.add(`${r2},${c2}`);
      }
    }
  }

  return conflictCells;
}

function getQueenCount(board, n) {
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (board[i][j] === CELL_QUEEN || board[i][j] === CELL_INITIAL) {
        count++;
      }
    }
  }
  return count;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function App() {
  const [n, setN] = useState(4);
  const [solution, setSolution] = useState([]);
  const [board, setBoard] = useState([]);
  const [gameWon, setGameWon] = useState(false);
  const [gridSize, setGridSize] = useState(GRID_MAX);
  const [conflicts, setConflicts] = useState(new Set());
  const [elapsed, setElapsed] = useState(0);
  const wonRef = useRef(false);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const generateGame = useCallback(
    (size, existingSolution = null) => {
      const sol = existingSolution || solveNQueens(size);
      setSolution(sol);

      const newBoard = Array(size)
        .fill(null)
        .map(() => Array(size).fill(CELL_EMPTY));

      const idx = Math.floor(Math.random() * sol.length);
      newBoard[sol[idx][0]][sol[idx][1]] = CELL_INITIAL;

      setBoard(newBoard);
      setConflicts(new Set());
      setGameWon(false);
      wonRef.current = false;
      startTimer();
    },
    [startTimer]
  );

  useEffect(() => {
    generateGame(4);
    return () => stopTimer();
  }, [generateGame, stopTimer]);

  useEffect(() => {
    const handleResize = () => {
      setGridSize(Math.min(GRID_MAX, window.innerWidth - 40));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (board.length === 0 || wonRef.current) return;

    const newConflicts = getConflicts(board, n);
    setConflicts(newConflicts);

    const queenCount = getQueenCount(board, n);
    if (queenCount === n && newConflicts.size === 0) {
      wonRef.current = true;
      setGameWon(true);
      stopTimer();
      setTimeout(fireConfetti, 150);
    }
  }, [board, n, stopTimer]);

  const fireConfetti = () => {
    const colors = ['#000000', '#222222', '#555555', '#888888', '#AAAAAA', '#CCCCCC'];
    const defaults = {
      colors,
      spread: 70,
      ticks: 200,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['circle', 'square'],
      scalar: 1.2,
    };

    confetti({ ...defaults, particleCount: 80, angle: 60, origin: { x: 0, y: 0.65 } });
    confetti({ ...defaults, particleCount: 80, angle: 120, origin: { x: 1, y: 0.65 } });

    setTimeout(() => {
      confetti({ ...defaults, particleCount: 60, angle: 90, origin: { x: 0.5, y: 0.65 } });
    }, 250);

    setTimeout(() => {
      confetti({ ...defaults, particleCount: 40, angle: 75, origin: { x: 0.2, y: 0.6 } });
      confetti({ ...defaults, particleCount: 40, angle: 105, origin: { x: 0.8, y: 0.6 } });
    }, 500);
  };

  const handleClick = (row, col) => {
    if (gameWon) return;
    if (board[row][col] === CELL_INITIAL) return;

    setBoard((prev) => {
      const next = prev.map((r) => [...r]);
      if (next[row][col] === CELL_QUEEN) {
        next[row][col] = CELL_EMPTY;
      } else {
        next[row][col] = CELL_QUEEN;
      }
      return next;
    });
  };

  const handleRightClick = (e, row, col) => {
    e.preventDefault();
    if (gameWon) return;
    if (board[row][col] === CELL_QUEEN || board[row][col] === CELL_INITIAL) return;

    setBoard((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = next[row][col] === CELL_MARKED ? CELL_EMPTY : CELL_MARKED;
      return next;
    });
  };

  const handleSizeChange = (newN) => {
    if (newN < 4 || newN > 15) return;
    setN(newN);
    generateGame(newN);
  };

  const handleRestart = () => generateGame(n, solution);
  const handleNewGame = () => generateGame(n);

  const cellFontSize = Math.max((gridSize / n) * 0.45, 12);

  return (
    <div className="app" onContextMenu={(e) => e.preventDefault()}>
      <div className="top-section">
        <h1 className="title">Queen&apos;s Game</h1>

        <div className="size-selector">
          <button
            className="arrow-btn"
            onClick={() => handleSizeChange(n - 1)}
            disabled={n <= 4}
            aria-label="Decrease size"
          >
            &#9664;
          </button>
          <span className="size-label">{n} Queens</span>
          <button
            className="arrow-btn"
            onClick={() => handleSizeChange(n + 1)}
            disabled={n >= 15}
            aria-label="Increase size"
          >
            &#9654;
          </button>
          <span className="timer-divider">|</span>
          <span className={`timer${gameWon ? ' timer-won' : ''}`}>{formatTime(elapsed)}</span>
        </div>
      </div>

      <div className="grid-wrapper">
        <div
          className="grid"
          style={{
            width: gridSize,
            height: gridSize,
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            gridTemplateRows: `repeat(${n}, 1fr)`,
          }}
        >
          {board.map((row, i) =>
            row.map((cell, j) => {
              const isQueen = cell === CELL_QUEEN || cell === CELL_INITIAL;
              const isConflict = isQueen && conflicts.has(`${i},${j}`);

              return (
                <div
                  key={`${i}-${j}`}
                  className={`cell${cell === CELL_MARKED ? ' marked' : ''}${
                    isQueen ? ' has-queen' : ''
                  }${isConflict ? ' conflict' : ''}${gameWon && isQueen ? ' won' : ''}`}
                  onClick={() => handleClick(i, j)}
                  onContextMenu={(e) => handleRightClick(e, i, j)}
                >
                  {isQueen && (
                    <span className="queen" style={{ fontSize: cellFontSize }}>
                      👑
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bottom-section">
        <div className="buttons">
          <button className="game-btn" onClick={handleRestart}>
            Restart
          </button>
          <button className="game-btn" onClick={handleNewGame}>
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
