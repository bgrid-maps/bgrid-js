// bgrid-js ESM build
// Core conversion utilities and BIP39 loader

const SUPPORTED_LANGS = ["en", "es", "fr", "pt", "zh"];

function _divisorsForLevel(level) {
  return level % 2 === 1
    ? { divisorLon: 64, divisorLat: 32 }
    : { divisorLon: 32, divisorLat: 64 };
}

export function coordsToBGrid(lat, lon, levels) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("lat/lon must be finite numbers");
  }
  if (!Number.isInteger(levels) || levels < 1) {
    throw new Error("levels must be a positive integer");
  }
  let x = (lon + 180) / 360;
  let y = (90 - lat) / 180;

  const result = [];
  for (let i = 1; i <= levels; i++) {
    const { divisorLon, divisorLat } = _divisorsForLevel(i);
    const col = Math.floor(x * divisorLon);
    const row = Math.floor(y * divisorLat);
    const index = row * divisorLon + col + 1; // 1..2048
    result.push(index);
    x = x * divisorLon - col;
    y = y * divisorLat - row;
  }
  return result;
}

export function bgridToCell(bgridArray) {
  if (!Array.isArray(bgridArray)) throw new Error("bgridArray must be an array");
  let minLon = -180, maxLon = 180;
  let minLat = -90, maxLat = 90;

  for (let i = 0; i < bgridArray.length; i++) {
    const index = bgridArray[i] - 1;
    const level = i + 1;
    const { divisorLon, divisorLat } = _divisorsForLevel(level);

    const col = index % divisorLon;
    const row = Math.floor(index / divisorLon);

    const lonWidth = (maxLon - minLon) / divisorLon;
    const latHeight = (maxLat - minLat) / divisorLat;

    minLon = minLon + col * lonWidth;
    maxLon = minLon + lonWidth;

    const newMaxLat = maxLat - row * latHeight;
    const newMinLat = newMaxLat - latHeight;
    minLat = newMinLat;
    maxLat = newMaxLat;
  }

  return {
    lat: (minLat + maxLat) / 2,
    lon: (minLon + maxLon) / 2,
    bounds: [
      [minLat, minLon],
      [maxLat, maxLon]
    ],
  };
}

export function getGridCells(level, parentGrid = [], maxLevel = 4) {
  const cells = [];
  if (level > maxLevel) return cells;
  const { divisorLon, divisorLat } = _divisorsForLevel(level);
  const total = divisorLon * divisorLat; // 2048 per level
  for (let i = 1; i <= total; i++) {
    const grid = [...parentGrid, i];
    const cell = bgridToCell(grid);
    cells.push({ index: i, grid, center: { lat: cell.lat, lon: cell.lon }, bounds: cell.bounds });
  }
  return cells;
}

// --- BIP39 loader helpers ---
export function isSupportedLanguage(lang) {
  return SUPPORTED_LANGS.includes(lang);
}

export async function loadLanguage(langCode, { basePath } = {}) {
  if (!isSupportedLanguage(langCode)) {
    throw new Error(`Unsupported language: ${langCode}`);
  }
  const defaultBase = new URL('../bip39-wordlist/', import.meta.url).toString().replace(/\/$/, '');
  const base = (basePath || defaultBase).replace(/\/$/, '');
  const url = `${base}/bip39-${langCode}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url} (HTTP ${res.status})`);
  const words = await res.json();
  if (!Array.isArray(words) || words.length !== 2048) {
    throw new Error(`Invalid bip39-${langCode}.json content (must be 2048 words array)`);
  }
  return words;
}

export async function loadLanguages(langs = SUPPORTED_LANGS, opts) {
  const entries = await Promise.all(
    langs.map(async (lc) => [lc, await loadLanguage(lc, opts)].catch((e) => [lc, e]))
  );
  const map = {};
  for (const [lc, value] of entries) {
    if (value instanceof Error) continue;
    map[lc] = value;
  }
  return map;
}

export function numberToWord(number, words) {
  if (!Array.isArray(words) || words.length !== 2048) return null;
  if (!Number.isInteger(number) || number < 1 || number > 2048) return null;
  return words[number - 1];
}

export function wordToNumber(word, words) {
  if (!Array.isArray(words) || words.length !== 2048) return null;
  if (!word) return null;
  const idx = words.indexOf(String(word).toLowerCase());
  return idx === -1 ? null : idx + 1;
}

export function gridToDisplay(gridArray, { mode = 'numbers', words } = {}) {
  if (!Array.isArray(gridArray)) return '';
  if (mode === 'words') {
    if (!Array.isArray(words)) throw new Error('words array required for words mode');
    return gridArray.map((n) => numberToWord(n, words)).join(',');
  }
  return gridArray.join(',');
}

export const VERSION = '0.1.0';

export default {
  VERSION,
  SUPPORTED_LANGS,
  coordsToBGrid,
  bgridToCell,
  getGridCells,
  isSupportedLanguage,
  loadLanguage,
  loadLanguages,
  numberToWord,
  wordToNumber,
  gridToDisplay,
};
