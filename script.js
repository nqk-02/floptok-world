const farmGrid = document.getElementById('farmGrid');
const flopCoinsEl = document.getElementById('flopCoins');
const memeSeedListEl = document.getElementById('memeSeedList');
const farmSeedListEl = document.getElementById('farmSeedList');
const gridSizeSelect = document.getElementById('gridSizeSelect');
const resetButton = document.getElementById('resetButton');
const activeActionEl = document.getElementById('activeAction');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const wallpaperBtn = document.getElementById('wallpaperBtn');
const wallpaperUpload = document.getElementById('wallpaperUpload');
const unlockedTilesEl = document.getElementById('unlockedTiles');
const totalTilesEl = document.getElementById('totalTiles');

const seedTypes = [
  {
    id: 'cvm',
    name: 'cVm seed',
    emoji: '💎',
    growthTime: 6,
    harvest: 18,
    description: 'Psychedelic gem shoots with neon wink.',
    color: '#ff9d5c',
    category: 'meme',
  },
  {
    id: 'horny',
    name: 'h0rNy seed',
    emoji: '🌶️',
    growthTime: 4,
    harvest: 12,
    description: 'Spicy surreal vines that glow with sass.',
    color: '#ff56b8',
    category: 'meme',
  },
  {
    id: 'Jiafei',
    name: 'Jiafei seed',
    emoji: '🍄',
    growthTime: 8,
    harvest: 25,
    description: 'Dreamy mushroom blooms with meme energy.',
    color: '#6c8cff',
    category: 'meme',
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    emoji: '🍉',
    growthTime: 15,
    harvest: 60,
    description: 'Refreshing red striped melons.',
    color: '#ff4444',
    category: 'farm',
  },
  {
    id: 'melon',
    name: 'Melon',
    emoji: '🌐',
    growthTime: 12,
    harvest: 45,
    description: 'Golden netted melons with sweet vibes.',
    color: '#ffaa44',
    category: 'farm',
  },
  {
    id: 'banana',
    name: 'Banana',
    emoji: '🍌',
    growthTime: 8,
    harvest: 30,
    description: 'Tropical yellow fruits of joy.',
    color: '#ffdd44',
    category: 'farm',
  },
];

let flopCoins = 120;
let selectedSeedId = seedTypes[0].id;
let gridSize = Number(gridSizeSelect.value);
let farmTiles = [];
let intervalId = null;
let unlockedTiles = new Set();

const UNLOCK_COST = 200;

function createTiles(size) {
  farmTiles = Array.from({ length: size * size }, () => ({
    state: 'dry',
    planted: null,
    progress: 0,
    timer: null,
  }));
  // Initialize unlocked tiles - first 5 are unlocked by default
  if (unlockedTiles.size === 0) {
    for (let i = 0; i < Math.min(5, size * size); i++) {
      unlockedTiles.add(i);
    }
  }
}

function updateFlopCoins() {
  flopCoinsEl.textContent = flopCoins;
}

function renderSeedShop() {
  memeSeedListEl.innerHTML = '';
  farmSeedListEl.innerHTML = '';
  
  const memeSeeds = seedTypes.filter(s => s.category === 'meme');
  const farmSeeds = seedTypes.filter(s => s.category === 'farm');
  
  const renderSeeds = (seeds, container) => {
    seeds.forEach((seed) => {
      const card = document.createElement('div');
      card.className = 'seed-card';
      card.innerHTML = `
        <div class="seed-icon" style="background: ${seed.color}22; color: ${seed.color};">${seed.emoji}</div>
        <div class="seed-meta">
          <div class="seed-name">${seed.name}</div>
          <div class="seed-description">${seed.description}</div>
          <div class="seed-description">Growth: ${seed.growthTime}s · Yield: ${seed.harvest} FlopCoins</div>
        </div>
        <div class="seed-action">
          <button class="seed-button" data-seed="${seed.id}">Select</button>
        </div>
      `;
      container.appendChild(card);
    });
  };
  
  renderSeeds(memeSeeds, memeSeedListEl);
  renderSeeds(farmSeeds, farmSeedListEl);
  updateSeedButtons();
}

function updateSeedButtons() {
  document.querySelectorAll('.seed-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.seed === selectedSeedId);
    button.textContent = button.dataset.seed === selectedSeedId ? 'Selected' : 'Select';
  });
}

function buildFarmGrid() {
  farmGrid.innerHTML = '';
  farmGrid.style.gridTemplateColumns = `repeat(${gridSize}, minmax(0, 1fr))`;
  totalTilesEl.textContent = gridSize * gridSize;
  farmTiles.forEach((tile, index) => {
    const tileEl = document.createElement('button');
    tileEl.type = 'button';
    tileEl.className = 'farm-tile';
    tileEl.dataset.index = index;
    
    const isLocked = !unlockedTiles.has(index);
    if (isLocked) {
      tileEl.classList.add('tile-locked');
      tileEl.addEventListener('click', () => onUnlockTile(index));
    } else {
      tileEl.addEventListener('click', () => onTileClick(index));
    }
    
    tileEl.innerHTML = `<div class="tile-inner"><div class="tile-world"></div></div>`;
    farmGrid.appendChild(tileEl);
  });
  updateFarmGrid();
}

function updateFarmGrid() {
  unlockedTilesEl.textContent = unlockedTiles.size;
  farmTiles.forEach((tile, index) => {
    const tileEl = farmGrid.children[index];
    const inner = tileEl.querySelector('.tile-inner');
    const world = inner.querySelector('.tile-world');
    const isLocked = !unlockedTiles.has(index);
    
    tileEl.classList.toggle('tile-watered', tile.state === 'watered');
    tileEl.classList.toggle('tile-planted', tile.state === 'planted' || tile.state === 'growing');
    tileEl.classList.toggle('tile-ready', tile.state === 'ready');
    tileEl.classList.toggle('tile-locked', isLocked);
    world.innerHTML = '';

    if (isLocked) {
      world.innerHTML = `<div class="tile-state"><div class="tile-label">🔒</div><div class="tile-subtitle">${UNLOCK_COST} FlopCoins</div></div>`;
    } else if (tile.state === 'dry') {
      world.innerHTML = '<div class="tile-state"><div class="tile-label">Empty</div><div class="tile-subtitle">Click to water</div></div>';
    } else if (tile.state === 'watered') {
      world.innerHTML = '<div class="tile-state"><div class="tile-label">Watered</div><div class="tile-subtitle">Plant a seed</div></div>';
    } else if (tile.state === 'planted' || tile.state === 'growing') {
      const seed = seedTypes.find((s) => s.id === tile.planted);
      const progress = Math.min(100, Math.floor((tile.progress / seed.growthTime) * 100));
      world.innerHTML = `
        <div class="tile-state">
          <div class="tile-label">${seed.emoji} ${seed.name}</div>
          <div class="tile-subtitle">Growing ${progress}%</div>
        </div>
      `;
      tileEl.style.boxShadow = `0 0 0 1px ${seed.color}, 0 0 16px ${seed.color}55`;
    } else if (tile.state === 'ready') {
      const seed = seedTypes.find((s) => s.id === tile.planted);
      world.innerHTML = `
        <div class="tile-state">
          <div class="tile-label">✨ Ready</div>
          <div class="tile-subtitle">Harvest ${seed.harvest} FlopCoins</div>
        </div>
      `;
      tileEl.style.boxShadow = `0 0 0 1px ${seed.color}, 0 0 24px ${seed.color}88`;
    }
    if (!isLocked && tile.state === 'dry') {
      tileEl.style.boxShadow = 'none';
    }
  });
}

function onTileClick(index) {
  const tile = farmTiles[index];
  if (tile.state === 'dry') {
    tile.state = 'watered';
    tile.progress = 0;
    tile.planted = null;
  } else if (tile.state === 'watered') {
    tile.state = 'planted';
    tile.planted = selectedSeedId;
    tile.progress = 0;
  } else if (tile.state === 'ready') {
    harvestTile(index);
    return;
  }
  updateFarmGrid();
}

function onUnlockTile(index) {
  if (flopCoins >= UNLOCK_COST) {
    flopCoins -= UNLOCK_COST;
    unlockedTiles.add(index);
    updateFlopCoins();
    updateFarmGrid();
  } else {
    alert(`Need ${UNLOCK_COST} FlopCoins to unlock this tile. You have ${flopCoins}.`);
  }
}

function harvestTile(index) {
  const tile = farmTiles[index];
  const seed = seedTypes.find((s) => s.id === tile.planted);
  flopCoins += seed.harvest;
  flopCoins = Math.max(0, flopCoins);
  tile.state = 'dry';
  tile.planted = null;
  tile.progress = 0;
  tile.timer = null;
  updateFlopCoins();
  updateFarmGrid();
}

function tickGrowth() {
  farmTiles.forEach((tile, index) => {
    if (tile.state === 'planted' || tile.state === 'growing') {
      tile.state = 'growing';
      tile.progress += 1;
      const seed = seedTypes.find((s) => s.id === tile.planted);
      if (tile.progress >= seed.growthTime) {
        tile.state = 'ready';
      }
    }
  });
  updateFarmGrid();
}

function initialize() {
  createTiles(gridSize);
  renderSeedShop();
  buildFarmGrid();
  updateFlopCoins();
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(tickGrowth, 1000);
  activeActionEl.textContent = 'Water / Plant';
  updateFarmGrid();
}

function exportGame() {
  const save = {
    version: 1,
    timestamp: new Date().toISOString(),
    flopCoins: flopCoins,
    selectedSeedId: selectedSeedId,
    gridSize: gridSize,
    unlockedTiles: Array.from(unlockedTiles),
    farmTiles: farmTiles,
  };
  
  const dataStr = JSON.stringify(save, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `floptok-save-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importGame() {
  importFile.click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const save = JSON.parse(e.target.result);
      
      flopCoins = save.flopCoins || 120;
      selectedSeedId = save.selectedSeedId || seedTypes[0].id;
      gridSize = save.gridSize || 5;
      unlockedTiles = new Set(save.unlockedTiles || [0, 1, 2, 3, 4]);
      farmTiles = save.farmTiles || [];
      
      gridSizeSelect.value = gridSize;
      
      // Re-render everything
      initialize();
      updateFlopCoins();
      updateFarmGrid();
      
      alert('Game progress loaded successfully!');
    } catch (error) {
      alert('Failed to load game progress: ' + error.message);
    }
  };
  reader.readAsText(file);
  
  // Reset input for next use
  importFile.value = '';
}

function handleWallpaperUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    document.body.style.backgroundImage = `url('${dataUrl}')`;
    // Store in localStorage so it persists
    localStorage.setItem('floptokWallpaper', dataUrl);
  };
  reader.readAsDataURL(file);
  
  // Reset input for next use
  wallpaperUpload.value = '';
}

function loadWallpaperFromStorage() {
  const stored = localStorage.getItem('floptokWallpaper');
  if (stored) {
    document.body.style.backgroundImage = `url('${stored}')`;
  }
}

memeSeedListEl.addEventListener('click', (event) => {
  if (!event.target.matches('.seed-button')) return;
  selectedSeedId = event.target.dataset.seed;
  updateSeedButtons();
});

farmSeedListEl.addEventListener('click', (event) => {
  if (!event.target.matches('.seed-button')) return;
  selectedSeedId = event.target.dataset.seed;
  updateSeedButtons();
});

gridSizeSelect.addEventListener('change', () => {
  gridSize = Number(gridSizeSelect.value);
  initialize();
});

resetButton.addEventListener('click', () => {
  if (confirm('Reset the farm? This will clear all progress!')) {
    flopCoins = 120;
    unlockedTiles = new Set([0, 1, 2, 3, 4]);
    initialize();
  }
});

exportBtn.addEventListener('click', exportGame);
importBtn.addEventListener('click', importGame);
importFile.addEventListener('change', handleImportFile);
wallpaperBtn.addEventListener('click', () => wallpaperUpload.click());
wallpaperUpload.addEventListener('change', handleWallpaperUpload);

loadWallpaperFromStorage();
initialize();
