import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { generatePuzzle } from './queensSolver';

const GRID_MAX = 480;
const CELL_EMPTY = 0;
const CELL_QUEEN = 1;
const CELL_MARKED = 2;
const CELL_INITIAL = 3;

const TIME_LIMITS = {
  4: 60,
  5: 90,
  6: 120,
  7: 180,
  8: 300,
  9: 360,
  10: 480,
  11: 600,
  12: 720,
  13: 900,
  14: 1080,
  15: 1200,
};

function getConflicts(board, size) {
  const queens = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === CELL_QUEEN || board[i][j] === CELL_INITIAL) {
        queens.push([i, j]);
      }
    }
  }
  const set = new Set();
  for (let a = 0; a < queens.length; a++) {
    for (let b = a + 1; b < queens.length; b++) {
      const [r1, c1] = queens[a];
      const [r2, c2] = queens[b];
      if (r1 === r2 || c1 === c2 || Math.abs(r1 - r2) === Math.abs(c1 - c2)) {
        set.add(`${r1},${c1}`);
        set.add(`${r2},${c2}`);
      }
    }
  }
  return set;
}

function queenCount(board, size) {
  let c = 0;
  for (let i = 0; i < size; i++)
    for (let j = 0; j < size; j++)
      if (board[i][j] === CELL_QUEEN || board[i][j] === CELL_INITIAL) c++;
  return c;
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function makeBoard(size, hintQueens) {
  const b = Array(size)
    .fill(null)
    .map(() => Array(size).fill(CELL_EMPTY));
  for (const [r, c] of hintQueens) b[r][c] = CELL_INITIAL;
  return b;
}

function App() {
  const [n, setN] = useState(4);
  const [hints, setHints] = useState([]);
  const [board, setBoard] = useState([]);
  const [gameWon, setGameWon] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [remaining, setRemaining] = useState(TIME_LIMITS[4]);
  const [conflicts, setConflicts] = useState(new Set());
  const [gridSize, setGridSize] = useState(GRID_MAX);
  const timerRef = useRef(null);
  const wonRef = useRef(false);

  /* ---- timer helpers ---- */
  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startCountdown(sec) {
    stopTimer();
    setRemaining(sec);
    timerRef.current = setInterval(() => {
      setRemaining((p) => {
        if (p <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  }

  /* ---- game lifecycle ---- */
  function startNewGame(size) {
    const { hints: h } = generatePuzzle(size);
    setN(size);
    setHints(h);
    setBoard(makeBoard(size, h));
    setConflicts(new Set());
    setGameWon(false);
    setTimeUp(false);
    wonRef.current = false;
    startCountdown(TIME_LIMITS[size]);
  }

  function restartGame() {
    setBoard(makeBoard(n, hints));
    setConflicts(new Set());
    setGameWon(false);
    setTimeUp(false);
    wonRef.current = false;
    startCountdown(TIME_LIMITS[n]);
  }

  /* ---- effects ---- */
  useEffect(() => {
    startNewGame(4);
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (remaining === 0 && !gameWon && !wonRef.current) {
      setTimeUp(true);
    }
  }, [remaining, gameWon]);

  useEffect(() => {
    const onResize = () => {
      const availH = window.innerHeight - 230;
      const availW = window.innerWidth - 40;
      setGridSize(Math.max(Math.min(GRID_MAX, availH, availW), 180));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (board.length === 0 || wonRef.current || timeUp) return;
    const c = getConflicts(board, board.length);
    setConflicts(c);
    if (queenCount(board, board.length) === n && c.size === 0) {
      wonRef.current = true;
      setGameWon(true);
      stopTimer();
      setTimeout(fireConfetti, 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, n, timeUp]);

  /* ---- confetti ---- */
  function fireConfetti() {
    const colors = ['#000', '#222', '#555', '#888', '#aaa', '#ccc'];
    const d = {
      colors,
      spread: 70,
      ticks: 200,
      gravity: 0.8,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['circle', 'square'],
      scalar: 1.2,
    };
    confetti({ ...d, particleCount: 80, angle: 60, origin: { x: 0, y: 0.65 } });
    confetti({ ...d, particleCount: 80, angle: 120, origin: { x: 1, y: 0.65 } });
    setTimeout(() => confetti({ ...d, particleCount: 60, angle: 90, origin: { x: 0.5, y: 0.65 } }), 250);
    setTimeout(() => {
      confetti({ ...d, particleCount: 40, angle: 75, origin: { x: 0.2, y: 0.6 } });
      confetti({ ...d, particleCount: 40, angle: 105, origin: { x: 0.8, y: 0.6 } });
    }, 500);
  }

  /* ---- handlers ---- */
  function handleClick(row, col) {
    if (gameWon || timeUp) return;
    if (board[row][col] === CELL_INITIAL) return;
    setBoard((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = next[row][col] === CELL_QUEEN ? CELL_EMPTY : CELL_QUEEN;
      return next;
    });
  }

  function handleRightClick(e, row, col) {
    e.preventDefault();
    if (gameWon || timeUp) return;
    if (board[row][col] === CELL_QUEEN || board[row][col] === CELL_INITIAL) return;
    setBoard((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = next[row][col] === CELL_MARKED ? CELL_EMPTY : CELL_MARKED;
      return next;
    });
  }

  function handleSizeChange(newN) {
    if (newN < 4 || newN > 15) return;
    startNewGame(newN);
  }

  const cellFont = Math.max((gridSize / n) * 0.45, 12);
  const timerDanger = remaining <= 30 && remaining > 0 && !gameWon;

  return (
    <div className="app">
      <div className="top-section">
        <h1 className="title">Queen&apos;s Game</h1>
        <div className="size-selector">
          <button className="arrow-btn" onClick={() => handleSizeChange(n - 1)} disabled={n <= 4}>
            &#9664;
          </button>
          <span className="size-label">{n} Queens</span>
          <button className="arrow-btn" onClick={() => handleSizeChange(n + 1)} disabled={n >= 15}>
            &#9654;
          </button>
          <span className="timer-divider">|</span>
          <span
            className={`timer${gameWon ? ' timer-won' : ''}${timeUp ? ' timer-up' : ''}${timerDanger ? ' timer-danger' : ''}`}
          >
            {fmt(remaining)}
          </span>
        </div>
      </div>

      <div className="grid-wrapper">
        <div className="grid-area" style={{ position: 'relative' }}>
          <div
            className="grid"
            onContextMenu={(e) => e.preventDefault()}
            style={{
              width: gridSize,
              height: gridSize,
              gridTemplateColumns: `repeat(${n}, 1fr)`,
              gridTemplateRows: `repeat(${n}, 1fr)`,
            }}
          >
            {board.map((row, i) =>
              row.map((cell, j) => {
                const isQ = cell === CELL_QUEEN || cell === CELL_INITIAL;
                const bad = isQ && conflicts.has(`${i},${j}`);
                return (
                  <div
                    key={`${i}-${j}`}
                    className={`cell${cell === CELL_MARKED ? ' marked' : ''}${isQ ? ' has-queen' : ''}${bad ? ' conflict' : ''}${gameWon && isQ ? ' won' : ''}`}
                    onClick={() => handleClick(i, j)}
                    onContextMenu={(e) => handleRightClick(e, i, j)}
                  >
                    {isQ && (
                      <span className="queen" style={{ fontSize: cellFont }}>
                        👑
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {timeUp && !gameWon && (
            <div className="overlay">
              <span className="overlay-text">Time&apos;s Up!</span>
            </div>
          )}
        </div>
      </div>

      <div className="bottom-section">
        <div className="buttons">
          <button className="game-btn" onClick={restartGame}>
            Restart
          </button>
          <button className="game-btn" onClick={() => startNewGame(n)}>
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
