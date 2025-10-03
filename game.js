// Snake game (plain JS, tiny engine) — by ChatGPT
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const CELL = 24;                    // cell size
const GRID = canvas.width / CELL;   // grid dimension (20 for 480px/24px -> 20)
let rafId = null;

const state = {
  snake: [{x: 10, y: 10}], // starts centered
  dir: {x: 1, y: 0},
  pendingDir: {x: 1, y: 0},
  apple: {x: 5, y: 5},
  speed: 8,             // cells per second
  grow: 0,
  score: 0,
  best: Number(localStorage.getItem('best-score') || 0),
  running: true,
  lastStep: 0,
};

// Utility
const randInt = (min, max) => Math.floor(Math.random()*(max-min+1))+min;

function placeApple() {
  while (true) {
    const a = { x: randInt(0, GRID-1), y: randInt(0, GRID-1) };
    if (!state.snake.some(s => s.x === a.x && s.y === a.y)) {
      state.apple = a; return;
    }
  }
}

function reset() {
  state.snake = [{x: 10, y: 10}];
  state.dir = {x: 1, y: 0};
  state.pendingDir = {x: 1, y: 0};
  state.grow = 0;
  state.score = 0;
  state.running = true;
  placeApple();
  updateHud();
}

function updateHud() {
  document.getElementById('score').textContent = state.score;
  document.getElementById('best').textContent = state.best;
  document.getElementById('pauseBtn').textContent = state.running ? '⏸️' : '▶️';
}

// Input handling
const keyToDir = {
  ArrowUp:    {x: 0, y: -1},
  ArrowDown:  {x: 0, y:  1},
  ArrowLeft:  {x: -1, y: 0},
  ArrowRight: {x: 1, y:  0},
  KeyW:       {x: 0, y: -1},
  KeyS:       {x: 0, y:  1},
  KeyA:       {x: -1, y: 0},
  KeyD:       {x: 1, y:  0},
};

window.addEventListener('keydown', (e) => {
  if (keyToDir[e.code]) {
    const nd = keyToDir[e.code];
    // prevent reversing instantly
    if (nd.x !== -state.dir.x || nd.y !== -state.dir.y) state.pendingDir = nd;
  } else if (e.code === 'Space') togglePause();
  else if (e.code === 'KeyR') reset();
});

// On-screen buttons
document.querySelectorAll('.mobile-controls button').forEach(btn => {
  btn.addEventListener('click', () => {
    const nd = keyToDir[btn.dataset.dir];
    if (nd && (nd.x !== -state.dir.x || nd.y !== -state.dir.y)) state.pendingDir = nd;
  });
});

document.getElementById('pauseBtn')?.addEventListener('click', togglePause);
document.getElementById('restartBtn')?.addEventListener('click', reset);

function togglePause() { state.running = !state.running; updateHud(); }

// Game loop
function tick(ts) {
  rafId = requestAnimationFrame(tick);
  if (!state.running) return;
  const stepTime = 1000 / state.speed;
  if (ts - state.lastStep < stepTime) return;
  state.lastStep = ts;

  // move
  state.dir = state.pendingDir;
  const head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };

  // collide walls
  if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID) return gameOver();

  // collide self
  if (state.snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();

  state.snake.unshift(head);
  if (head.x === state.apple.x && head.y === state.apple.y) {
    state.score += 1;
    state.grow += 2;
    if (state.score % 5 === 0) state.speed = Math.min(18, state.speed + 1); // speed up
    placeApple();
    updateHud();
    hitFlash();
  } else if (state.grow > 0) {
    state.grow--;
  } else {
    state.snake.pop();
  }

  draw();
}

function gameOver() {
  state.running = false;
  state.best = Math.max(state.best, state.score);
  localStorage.setItem('best-score', String(state.best));
  updateHud();
  draw(true);
}

// VFX
let flashAlpha = 0;
function hitFlash() { flashAlpha = 0.6; }

function draw(showGameOver=false) {
  // background grid
  ctx.fillStyle = '#041d0b';
  ctx.fillRect(0,0,canvas.width, canvas.height);

  for (let y=0;y<GRID;y++) {
    for (let x=0;x<GRID;x++) {
      if ((x+y)%2===0) {
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = '#1b4d2e';
        ctx.fillRect(x*CELL, y*CELL, CELL, CELL);
        ctx.globalAlpha = 1;
      }
    }
  }

  // apple
  ctx.fillStyle = '#ef4444';
  roundRect(ctx, state.apple.x*CELL+4, state.apple.y*CELL+4, CELL-8, CELL-8, 6, true, false);
  // tiny leaf
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(state.apple.x*CELL+CELL/2-2, state.apple.y*CELL+2, 4, 6);

  // snake
  for (let i=0;i<state.snake.length;i++){
    const s = state.snake[i];
    const t = i===0 ? '#86efac' : '#34d399';
    ctx.fillStyle = t;
    roundRect(ctx, s.x*CELL+2, s.y*CELL+2, CELL-4, CELL-4, 6, true, false);
  }

  // flash
  if (flashAlpha > 0) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.globalAlpha = 1; flashAlpha = Math.max(0, flashAlpha - 0.08);
  }

  if (showGameOver) {
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = '#e5ffe9';
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 10);
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 18);
  }
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (w<2*r) r=w/2; if (h<2*r) r=h/2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Init
placeApple();
updateHud();
draw();
rafId = requestAnimationFrame(tick);
