# bgrid-js

A tiny JavaScript library to work with BGrid indexes (coords <-> grid), plus helpers to format using BIP39 wordlists.

- ESM: `bgrid-js/dist/bgrid.mjs`
- UMD (global `BGrid`): `bgrid-js/dist/bgrid.umd.js`
- Language wordlists: `bgrid-js/bip39-wordlist/bip39-*.json`

Note: In this repo the BIP39 lists live under `bip39-wordlist`. The library defaults to that path.

## Quick start

ES modules:

```html
<script type="module">
  import { coordsToBGrid, bgridToCell, loadLanguage, gridToDisplay } from './bgrid-js/dist/bgrid.mjs';

  const grid = coordsToBGrid(40.4168, -3.7038, 4); // Madrid, 4 levels
  console.log('BGrid:', grid);

  const cell = bgridToCell(grid);
  console.log('Center:', cell.lat, cell.lon, 'Bounds:', cell.bounds);

  // basePath defaults to './bgrid-js/bip39-wordlist', so passing it is optional here
  const es = await loadLanguage('es');
  console.log('Words:', gridToDisplay(grid, { mode: 'words', words: es }));
</script>
```

UMD:

```html
<script src="./bgrid-js/dist/bgrid.umd.js"></script>
<script>
  const grid = BGrid.coordsToBGrid(40.4168, -3.7038, 4);
  const cell = BGrid.bgridToCell(grid);
  // Defaults to './bgrid-js/bip39-wordlist'
  BGrid.loadLanguage('es').then(function(es){
    console.log(BGrid.gridToDisplay(grid, { mode: 'words', words: es }));
  });
</script>
```

## API

- `coordsToBGrid(lat, lon, levels): number[]`
- `bgridToCell(bgridArray): { lat: number, lon: number, bounds: [[number, number],[number, number]] }`
- `getGridCells(level, parentGrid = [], maxLevel = 4): Array<{ index, grid, center, bounds }>`
- `loadLanguage(langCode, { basePath }): Promise<string[]>`
- `loadLanguages(langs?, { basePath }): Promise<Record<string,string[]>>`
- `numberToWord(number, words): string | null`
- `wordToNumber(word, words): number | null`
- `gridToDisplay(gridArray, { mode: 'numbers'|'words', words? }): string`

Supported languages: `en`, `es`, `fr`, `pt`, `zh`.
