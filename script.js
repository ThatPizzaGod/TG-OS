const root = document.documentElement;
const body = document.body;
const storageKeys = {
  settings: 'tg-os-settings',
  notes: 'tg-os-notes',
  todos: 'tg-os-todos',
  paint: 'tg-os-paint',
};

const defaultSettings = {
  accent: '#6d5dfc',
  accentStrong: '#11d6c5',
  surface: '#151a2e',
  desktopGlow: '#0b1020',
  compactMode: false,
  largeText: false,
  reduceGlow: false,
  showTips: true,
  density: 'comfortable',
};

const presets = {
  violet: { accent: '#6d5dfc', accentStrong: '#11d6c5', surface: '#151a2e', desktopGlow: '#0b1020' },
  sunset: { accent: '#ff7a59', accentStrong: '#ffb347', surface: '#23131f', desktopGlow: '#14080f' },
  forest: { accent: '#3ddc97', accentStrong: '#80ed99', surface: '#12211a', desktopGlow: '#07130e' },
  ice: { accent: '#5dade2', accentStrong: '#7ef9ff', surface: '#122035', desktopGlow: '#060d18' },
};

function loadStored(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const settings = { ...defaultSettings, ...loadStored(storageKeys.settings, {}) };
const themeInputs = {
  accent: document.querySelector('#accent-color'),
  accentStrong: document.querySelector('#accent-strong-color'),
  surface: document.querySelector('#surface-color'),
  desktopGlow: document.querySelector('#desktop-glow-color'),
};
const toggleInputs = {
  compactMode: document.querySelector('#compact-toggle'),
  largeText: document.querySelector('#large-text-toggle'),
  reduceGlow: document.querySelector('#glow-toggle'),
  showTips: document.querySelector('#tips-toggle'),
};
const densitySelect = document.querySelector('#density-select');
const taskbarClock = document.querySelector('#taskbar-clock');
const taskbarStatus = document.querySelector('#taskbar-status');
const backdrop = document.querySelector('#window-backdrop');
const windows = [...document.querySelectorAll('.app-window')];
let topWindowZ = 50;

function shiftColor(hex, amount) {
  const value = hex.replace('#', '');
  const size = value.length === 3 ? 1 : 2;
  const parts = value.match(new RegExp(`.{1,${size}}`, 'g')) || [];
  const expanded = parts.map((part) => (size === 1 ? part + part : part));
  const shifted = expanded.map((part) => {
    const next = Math.max(0, Math.min(255, parseInt(part, 16) + amount));
    return next.toString(16).padStart(2, '0');
  });
  return `#${shifted.join('')}`;
}

function updateBackdrop() {
  const hasOpenWindow = windows.some((windowElement) => !windowElement.hidden);
  backdrop.hidden = !hasOpenWindow;
}

function setStatus(message) {
  taskbarStatus.textContent = message;
}

function bringToFront(windowElement) {
  topWindowZ += 1;
  windowElement.style.zIndex = String(topWindowZ);
}

function openWindow(windowId) {
  const windowElement = document.getElementById(windowId);
  if (!windowElement) return;
  windowElement.hidden = false;
  bringToFront(windowElement);
  updateBackdrop();
  setStatus(`${windowElement.querySelector('h2').textContent} opened.`);
}

function closeWindow(windowId) {
  const windowElement = document.getElementById(windowId);
  if (!windowElement) return;
  windowElement.hidden = true;
  updateBackdrop();
  setStatus(`${windowElement.querySelector('h2').textContent} closed.`);
}

function applySettings() {
  root.style.setProperty('--accent', settings.accent);
  root.style.setProperty('--accent-strong', settings.accentStrong);
  root.style.setProperty('--surface', settings.surface);
  root.style.setProperty('--surface-2', shiftColor(settings.surface, -12));
  root.style.setProperty('--desktop-glow', settings.desktopGlow);
  root.style.setProperty('--font-scale', settings.largeText ? '1.08' : '1');
  root.style.setProperty('--density-gap', settings.density === 'compact' ? '16px' : settings.density === 'spacious' ? '30px' : '24px');

  body.classList.toggle('compact-mode', settings.compactMode);
  body.classList.toggle('low-glow', settings.reduceGlow);
  body.classList.toggle('hide-tips', !settings.showTips);

  Object.entries(themeInputs).forEach(([key, input]) => {
    input.value = settings[key];
  });
  Object.entries(toggleInputs).forEach(([key, input]) => {
    input.checked = Boolean(settings[key]);
  });
  densitySelect.value = settings.density;
  document.querySelector('#paint-color').value = settings.accent;
  saveStored(storageKeys.settings, settings);
}

Object.entries(themeInputs).forEach(([key, input]) => {
  input.addEventListener('input', (event) => {
    settings[key] = event.target.value;
    applySettings();
    drawSnake();
    setStatus('Theme updated.');
  });
});

Object.entries(toggleInputs).forEach(([key, input]) => {
  input.addEventListener('change', (event) => {
    settings[key] = event.target.checked;
    applySettings();
    setStatus('Desktop preferences updated.');
  });
});

densitySelect.addEventListener('change', (event) => {
  settings.density = event.target.value;
  applySettings();
  setStatus('Density updated.');
});

document.querySelectorAll('.preset').forEach((button) => {
  button.addEventListener('click', () => {
    Object.assign(settings, presets[button.dataset.preset]);
    applySettings();
    drawSnake();
    setStatus(`Applied ${button.dataset.preset} preset.`);
  });
});

document.querySelector('#random-theme').addEventListener('click', () => {
  const randomColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
  const accent = randomColor();
  const accentStrong = randomColor();
  const seed = randomColor();
  settings.accent = accent;
  settings.accentStrong = accentStrong;
  settings.surface = shiftColor(seed, -20);
  settings.desktopGlow = shiftColor(seed, -55);
  applySettings();
  drawSnake();
  setStatus('Random theme applied.');
});

document.querySelector('#reset-settings').addEventListener('click', () => {
  Object.assign(settings, { ...defaultSettings });
  applySettings();
  drawSnake();
  setStatus('Settings reset to defaults.');
});

document.querySelectorAll('[data-open]').forEach((button) => {
  button.addEventListener('click', () => {
    openWindow(button.dataset.open);
  });
});

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => {
    closeWindow(button.dataset.close);
  });
});

backdrop.addEventListener('click', () => {
  windows.forEach((windowElement) => {
    windowElement.hidden = true;
  });
  updateBackdrop();
  setStatus('All windows closed.');
});

windows.forEach((windowElement) => {
  windowElement.addEventListener('mousedown', () => {
    bringToFront(windowElement);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    windows.forEach((windowElement) => {
      windowElement.hidden = true;
    });
    updateBackdrop();
    setStatus('All windows closed.');
  }
});

// Snake
const snakeCanvas = document.querySelector('#snake-canvas');
const snakeCtx = snakeCanvas.getContext('2d');
const snakeScore = document.querySelector('#snake-score');
const snakeBest = document.querySelector('#snake-best');
const snakeStartButton = document.querySelector('#snake-start');
const gridSize = 16;
const tileSize = snakeCanvas.width / gridSize;
let snake = [{ x: 8, y: 8 }];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 4, y: 4 };
let snakeLoop = null;
let snakePoints = 0;
let bestScore = 0;

function randomCell() {
  let cell;
  do {
    cell = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
  } while (snake.some((segment) => segment.x === cell.x && segment.y === cell.y));
  return cell;
}

function resetSnake() {
  snake = [{ x: 8, y: 8 }];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  snakePoints = 0;
  snakeScore.textContent = '0';
  food = randomCell();
  drawSnake();
}

function endSnakeGame() {
  if (snakeLoop) clearInterval(snakeLoop);
  bestScore = Math.max(bestScore, snakePoints);
  snakeBest.textContent = String(bestScore);
  setStatus('Snake game over.');
}

function stepSnake() {
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize;
  const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);
  if (hitWall || hitSelf) {
    endSnakeGame();
    drawSnake(true);
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    snakePoints += 10;
    snakeScore.textContent = String(snakePoints);
    food = randomCell();
  } else {
    snake.pop();
  }
  drawSnake();
}

function drawRoundedTile(x, y, color) {
  snakeCtx.fillStyle = color;
  snakeCtx.beginPath();
  snakeCtx.roundRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4, 8);
  snakeCtx.fill();
}

function drawSnake(gameOver = false) {
  const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#6d5dfc';
  const accentStrong = getComputedStyle(root).getPropertyValue('--accent-strong').trim() || '#11d6c5';
  snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
  snakeCtx.fillStyle = 'rgba(255,255,255,0.04)';
  snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
  snakeCtx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let index = 0; index <= gridSize; index += 1) {
    snakeCtx.beginPath();
    snakeCtx.moveTo(index * tileSize, 0);
    snakeCtx.lineTo(index * tileSize, snakeCanvas.height);
    snakeCtx.stroke();
    snakeCtx.beginPath();
    snakeCtx.moveTo(0, index * tileSize);
    snakeCtx.lineTo(snakeCanvas.width, index * tileSize);
    snakeCtx.stroke();
  }
  drawRoundedTile(food.x, food.y, '#ff6b81');
  snake.forEach((segment, index) => {
    drawRoundedTile(segment.x, segment.y, index === 0 ? accentStrong : accent);
  });
  if (gameOver) {
    snakeCtx.fillStyle = 'rgba(0,0,0,0.58)';
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    snakeCtx.fillStyle = '#ffffff';
    snakeCtx.font = 'bold 28px sans-serif';
    snakeCtx.textAlign = 'center';
    snakeCtx.fillText('Game Over', snakeCanvas.width / 2, snakeCanvas.height / 2);
  }
}

function queueDirection(next) {
  const isReverse = next.x === direction.x * -1 && next.y === direction.y * -1;
  if (!isReverse) nextDirection = next;
}

snakeStartButton.addEventListener('click', () => {
  resetSnake();
  if (snakeLoop) clearInterval(snakeLoop);
  snakeLoop = setInterval(stepSnake, 150);
  setStatus('Snake started.');
});

document.querySelectorAll('[data-direction]').forEach((button) => {
  button.addEventListener('click', () => {
    const map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    queueDirection(map[button.dataset.direction]);
  });
});

// Calculator
const calculatorDisplay = document.querySelector('#calculator-display');
const calculatorExpression = document.querySelector('#calculator-expression');
const calculatorHistory = document.querySelector('#calculator-history');
let historyEntries = [];
const calcState = { display: '0', storedValue: null, operator: null, waitingForNewValue: false };

function renderCalculator() {
  calculatorDisplay.textContent = calcState.display;
  calculatorExpression.textContent = calcState.operator && calcState.storedValue !== null ? `${calcState.storedValue} ${calcState.operator}` : calcState.display;
}

function renderHistory() {
  calculatorHistory.innerHTML = historyEntries.length
    ? historyEntries.slice(-8).reverse().map((entry) => `<li><strong>${entry.result}</strong><br /><span class="muted">${entry.expression}</span></li>`).join('')
    : '<li class="muted">No calculations yet.</li>';
}

function calculate(first, second, operator) {
  const a = Number(first);
  const b = Number(second);
  if (operator === '+') return a + b;
  if (operator === '-') return a - b;
  if (operator === '*') return a * b;
  if (operator === '/') return b === 0 ? 'Error' : a / b;
  return b;
}

function handleCalculatorAction(action, value) {
  if (action === 'digit') {
    calcState.display = calcState.waitingForNewValue ? value : calcState.display === '0' ? value : calcState.display + value;
    calcState.waitingForNewValue = false;
  }
  if (action === 'decimal' && !calcState.display.includes('.')) calcState.display += '.';
  if (action === 'clear') {
    calcState.display = '0';
    calcState.storedValue = null;
    calcState.operator = null;
    calcState.waitingForNewValue = false;
  }
  if (action === 'negate') calcState.display = String(Number(calcState.display) * -1);
  if (action === 'percent') calcState.display = String(Number(calcState.display) / 100);
  if (action === 'operator') {
    if (calcState.operator && !calcState.waitingForNewValue) {
      calcState.display = String(calculate(calcState.storedValue, calcState.display, calcState.operator));
      calcState.storedValue = calcState.display;
    } else {
      calcState.storedValue = calcState.display;
    }
    calcState.operator = value;
    calcState.waitingForNewValue = true;
  }
  if (action === 'equals' && calcState.operator && calcState.storedValue !== null) {
    const expression = `${calcState.storedValue} ${calcState.operator} ${calcState.display}`;
    const result = String(calculate(calcState.storedValue, calcState.display, calcState.operator));
    calcState.display = result;
    calcState.storedValue = null;
    calcState.operator = null;
    calcState.waitingForNewValue = true;
    historyEntries.push({ expression, result });
    renderHistory();
    setStatus('Calculation completed.');
  }
  renderCalculator();
}

document.querySelector('#calculator-grid').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  handleCalculatorAction(button.dataset.action, button.dataset.value);
});

document.querySelector('#clear-history').addEventListener('click', () => {
  historyEntries = [];
  renderHistory();
  setStatus('Calculator history cleared.');
});

document.addEventListener('keydown', (event) => {
  if (document.getElementById('calculator-window').hidden) return;
  if (/^[0-9]$/.test(event.key)) handleCalculatorAction('digit', event.key);
  if (event.key === '.') handleCalculatorAction('decimal');
  if (['+', '-', '*', '/'].includes(event.key)) handleCalculatorAction('operator', event.key);
  if (event.key === 'Enter' || event.key === '=') handleCalculatorAction('equals');
  if (event.key.toLowerCase() === 'c') handleCalculatorAction('clear');
});

// Minesweeper
const mineCountElement = document.querySelector('#mine-count');
const mineTimerElement = document.querySelector('#mine-timer');
const mineStatusElement = document.querySelector('#minesweeper-status');
const mineBoardElement = document.querySelector('#minesweeper-board');
const boardSize = 8;
const mineTotal = 10;
let mineBoard = [];
let mineTimer = 0;
let mineTimerLoop = null;
let revealedCount = 0;
let gameFinished = false;

function getNeighbors(row, col) {
  const neighbors = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) continue;
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;
      if (nextRow >= 0 && nextRow < boardSize && nextCol >= 0 && nextCol < boardSize) neighbors.push(mineBoard[nextRow][nextCol]);
    }
  }
  return neighbors;
}

function createBoard() {
  mineBoard = Array.from({ length: boardSize }, (_, row) => Array.from({ length: boardSize }, (_, col) => ({ row, col, mine: false, adjacent: 0, revealed: false, flagged: false })));
  let placed = 0;
  while (placed < mineTotal) {
    const row = Math.floor(Math.random() * boardSize);
    const col = Math.floor(Math.random() * boardSize);
    if (!mineBoard[row][col].mine) {
      mineBoard[row][col].mine = true;
      placed += 1;
    }
  }
  for (let row = 0; row < boardSize; row += 1) {
    for (let col = 0; col < boardSize; col += 1) {
      mineBoard[row][col].adjacent = getNeighbors(row, col).filter((cell) => cell.mine).length;
    }
  }
}

function renderBoard() {
  mineBoardElement.innerHTML = '';
  const flaggedCount = mineBoard.flat().filter((cell) => cell.flagged).length;
  mineCountElement.textContent = String(Math.max(0, mineTotal - flaggedCount));
  mineBoard.flat().forEach((cell) => {
    const button = document.createElement('button');
    button.className = 'cell';
    if (cell.revealed) button.classList.add('revealed');
    if (cell.flagged) button.classList.add('flagged');
    if (cell.mine) button.classList.add('mine');
    button.dataset.row = String(cell.row);
    button.dataset.col = String(cell.col);
    if (cell.flagged) button.textContent = '⚑';
    if (cell.revealed && cell.mine) button.textContent = '✹';
    if (cell.revealed && !cell.mine && cell.adjacent > 0) button.textContent = String(cell.adjacent);
    mineBoardElement.appendChild(button);
  });
}

function stopMineTimer() {
  if (mineTimerLoop) clearInterval(mineTimerLoop);
}

function startMineTimer() {
  stopMineTimer();
  mineTimerLoop = setInterval(() => {
    mineTimer += 1;
    mineTimerElement.textContent = `${mineTimer}s`;
  }, 1000);
}

function revealCell(row, col) {
  const cell = mineBoard[row][col];
  if (cell.revealed || cell.flagged || gameFinished) return;
  cell.revealed = true;
  revealedCount += 1;
  if (cell.mine) {
    gameFinished = true;
    stopMineTimer();
    mineStatusElement.textContent = 'Boom! You hit a mine.';
    mineBoard.flat().forEach((entry) => {
      if (entry.mine) entry.revealed = true;
    });
    renderBoard();
    setStatus('Minesweeper lost.');
    return;
  }
  if (cell.adjacent === 0) {
    getNeighbors(row, col).forEach((neighbor) => {
      if (!neighbor.revealed) revealCell(neighbor.row, neighbor.col);
    });
  }
  if (revealedCount === boardSize * boardSize - mineTotal) {
    gameFinished = true;
    stopMineTimer();
    mineStatusElement.textContent = 'You cleared the field!';
    setStatus('Minesweeper won.');
  }
  renderBoard();
}

function toggleFlag(row, col) {
  const cell = mineBoard[row][col];
  if (cell.revealed || gameFinished) return;
  cell.flagged = !cell.flagged;
  renderBoard();
}

function resetMinesweeper() {
  revealedCount = 0;
  mineTimer = 0;
  gameFinished = false;
  mineTimerElement.textContent = '0s';
  mineStatusElement.textContent = 'Board ready.';
  createBoard();
  renderBoard();
  startMineTimer();
}

document.querySelector('#minesweeper-reset').addEventListener('click', () => {
  resetMinesweeper();
  setStatus('Minesweeper reset.');
});
mineBoardElement.addEventListener('click', (event) => {
  const cellButton = event.target.closest('.cell');
  if (!cellButton) return;
  revealCell(Number(cellButton.dataset.row), Number(cellButton.dataset.col));
});
mineBoardElement.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  const cellButton = event.target.closest('.cell');
  if (!cellButton) return;
  toggleFlag(Number(cellButton.dataset.row), Number(cellButton.dataset.col));
});

// Notes
const notesArea = document.querySelector('#notes-area');
notesArea.value = localStorage.getItem(storageKeys.notes) || '';
notesArea.addEventListener('input', () => {
  localStorage.setItem(storageKeys.notes, notesArea.value);
  setStatus('Notes saved.');
});
document.querySelector('#clear-notes').addEventListener('click', () => {
  notesArea.value = '';
  localStorage.setItem(storageKeys.notes, '');
  setStatus('Notes cleared.');
});

// Todo
const todoForm = document.querySelector('#todo-form');
const todoInput = document.querySelector('#todo-input');
const todoListElement = document.querySelector('#todo-list');
const todoTotal = document.querySelector('#todo-total');
const todoDone = document.querySelector('#todo-done');
let todos = loadStored(storageKeys.todos, []);

function renderTodos() {
  todoListElement.innerHTML = todos.length ? '' : '<li class="muted">No tasks yet.</li>';
  todos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = `todo-item${todo.done ? ' done' : ''}`;
    item.innerHTML = `<span>${todo.text}</span><div class="button-row"><button class="ghost-button" data-todo-toggle="${todo.id}">${todo.done ? 'Undo' : 'Done'}</button><button class="ghost-button" data-todo-delete="${todo.id}">Delete</button></div>`;
    todoListElement.appendChild(item);
  });
  todoTotal.textContent = String(todos.length);
  todoDone.textContent = String(todos.filter((todo) => todo.done).length);
  saveStored(storageKeys.todos, todos);
}

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, done: false });
  todoInput.value = '';
  renderTodos();
  setStatus('Task added.');
});

todoListElement.addEventListener('click', (event) => {
  const toggleButton = event.target.closest('[data-todo-toggle]');
  const deleteButton = event.target.closest('[data-todo-delete]');
  if (toggleButton) {
    todos = todos.map((todo) => todo.id === Number(toggleButton.dataset.todoToggle) ? { ...todo, done: !todo.done } : todo);
    setStatus('Task updated.');
  }
  if (deleteButton) {
    todos = todos.filter((todo) => todo.id !== Number(deleteButton.dataset.todoDelete));
    setStatus('Task deleted.');
  }
  renderTodos();
});

document.querySelector('#clear-completed').addEventListener('click', () => {
  todos = todos.filter((todo) => !todo.done);
  renderTodos();
  setStatus('Completed tasks cleared.');
});

// Pixel painter
const paintGrid = document.querySelector('#paint-grid');
const paintColorInput = document.querySelector('#paint-color');
let isPainting = false;
let paintCells = loadStored(storageKeys.paint, Array.from({ length: 256 }, () => ''));

function savePaint() {
  saveStored(storageKeys.paint, paintCells);
}

function renderPaintGrid() {
  paintGrid.innerHTML = '';
  paintCells.forEach((color, index) => {
    const cell = document.createElement('button');
    cell.className = 'paint-cell';
    cell.dataset.index = String(index);
    cell.style.background = color || 'rgba(255,255,255,0.06)';
    paintGrid.appendChild(cell);
  });
}

function updatePaintCell(index) {
  const cell = paintGrid.querySelector(`[data-index="${index}"]`);
  if (!cell) return;
  const color = paintColorInput.value;
  paintCells[index] = color;
  cell.style.background = color;
  savePaint();
}

paintGrid.addEventListener('mousedown', (event) => {
  const cell = event.target.closest('.paint-cell');
  if (!cell) return;
  isPainting = true;
  updatePaintCell(Number(cell.dataset.index));
  setStatus('Painting...');
});
paintGrid.addEventListener('mouseover', (event) => {
  if (!isPainting) return;
  const cell = event.target.closest('.paint-cell');
  if (!cell) return;
  updatePaintCell(Number(cell.dataset.index));
});
document.addEventListener('mouseup', () => {
  if (isPainting) setStatus('Painting saved.');
  isPainting = false;
});
document.querySelector('#clear-painter').addEventListener('click', () => {
  paintCells = Array.from({ length: 256 }, () => '');
  savePaint();
  renderPaintGrid();
  setStatus('Pixel canvas cleared.');
});
document.querySelector('#fill-painter').addEventListener('click', () => {
  paintCells = Array.from({ length: 256 }, () => paintColorInput.value);
  savePaint();
  renderPaintGrid();
  setStatus('Pixel canvas filled.');
});

// Memory match
const memoryIcons = ['🌙', '⚡', '🎲', '🎵', '🪐', '🚀'];
const memoryGrid = document.querySelector('#memory-grid');
const memoryMoves = document.querySelector('#memory-moves');
const memoryMatches = document.querySelector('#memory-matches');
const memoryStatus = document.querySelector('#memory-status');
let memoryCards = [];
let flippedCards = [];
let memoryMoveCount = 0;
let memoryMatchCount = 0;
let memoryLock = false;

function shuffle(array) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function resetMemory() {
  memoryCards = shuffle([...memoryIcons, ...memoryIcons]).map((icon, index) => ({ id: index, icon, flipped: false, matched: false }));
  flippedCards = [];
  memoryMoveCount = 0;
  memoryMatchCount = 0;
  memoryLock = false;
  memoryStatus.textContent = 'Find all matching pairs.';
  renderMemory();
}

function renderMemory() {
  memoryMoves.textContent = String(memoryMoveCount);
  memoryMatches.textContent = String(memoryMatchCount);
  memoryGrid.innerHTML = '';
  memoryCards.forEach((card) => {
    const button = document.createElement('button');
    button.className = `memory-card${card.matched ? ' matched' : ''}`;
    button.dataset.id = String(card.id);
    button.textContent = card.flipped || card.matched ? card.icon : '•';
    memoryGrid.appendChild(button);
  });
}

function flipMemoryCard(id) {
  if (memoryLock) return;
  const card = memoryCards.find((entry) => entry.id === id);
  if (!card || card.flipped || card.matched) return;
  card.flipped = true;
  flippedCards.push(card);
  renderMemory();
  if (flippedCards.length === 2) {
    memoryMoveCount += 1;
    const [first, second] = flippedCards;
    if (first.icon === second.icon) {
      first.matched = true;
      second.matched = true;
      memoryMatchCount += 1;
      flippedCards = [];
      if (memoryMatchCount === memoryIcons.length) {
        memoryStatus.textContent = 'Perfect! You cleared the board.';
        setStatus('Memory Match completed.');
      }
      renderMemory();
      return;
    }
    memoryLock = true;
    setTimeout(() => {
      first.flipped = false;
      second.flipped = false;
      flippedCards = [];
      memoryLock = false;
      renderMemory();
    }, 700);
  }
}

memoryGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.memory-card');
  if (!card) return;
  flipMemoryCard(Number(card.dataset.id));
});
document.querySelector('#memory-reset').addEventListener('click', () => {
  resetMemory();
  setStatus('Memory board shuffled.');
});

// Clock + timer
const clockDisplay = document.querySelector('#clock-display');
const clockDate = document.querySelector('#clock-date');
const timerMinutesInput = document.querySelector('#timer-minutes');
const timerDisplay = document.querySelector('#timer-display');
const timerStatus = document.querySelector('#timer-status');
let timerRemaining = 5 * 60;
let timerLoop = null;

function renderClock() {
  const now = new Date();
  clockDisplay.textContent = now.toLocaleTimeString();
  clockDate.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  taskbarClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function sanitizeTimerMinutes() {
  const parsed = Number(timerMinutesInput.value);
  const safeValue = Number.isFinite(parsed) ? Math.min(180, Math.max(1, Math.round(parsed))) : 5;
  timerMinutesInput.value = String(safeValue);
  return safeValue;
}

function renderTimer() {
  const minutes = String(Math.floor(timerRemaining / 60)).padStart(2, '0');
  const seconds = String(timerRemaining % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function resetTimer() {
  if (timerLoop) clearInterval(timerLoop);
  timerRemaining = sanitizeTimerMinutes() * 60;
  timerStatus.textContent = 'Ready for a focus session.';
  renderTimer();
}

document.querySelector('#timer-start').addEventListener('click', () => {
  if (timerLoop) clearInterval(timerLoop);
  if (timerRemaining <= 0) timerRemaining = sanitizeTimerMinutes() * 60;
  timerStatus.textContent = 'Countdown running...';
  setStatus('Timer started.');
  timerLoop = setInterval(() => {
    timerRemaining -= 1;
    renderTimer();
    if (timerRemaining <= 0) {
      clearInterval(timerLoop);
      timerStatus.textContent = 'Timer complete!';
      timerRemaining = 0;
      renderTimer();
      setStatus('Timer complete.');
    }
  }, 1000);
});
document.querySelector('#timer-reset').addEventListener('click', () => {
  resetTimer();
  setStatus('Timer reset.');
});
timerMinutesInput.addEventListener('change', resetTimer);
setInterval(renderClock, 1000);

applySettings();
renderCalculator();
renderHistory();
resetSnake();
resetMinesweeper();
renderTodos();
renderPaintGrid();
resetMemory();
renderClock();
resetTimer();
updateBackdrop();
setStatus('Desktop ready.');
