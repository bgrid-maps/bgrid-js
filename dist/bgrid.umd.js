/* bgrid-js UMD build */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BGrid = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SUPPORTED_LANGS = ["eN","eS","fR","pT","zH"].map(function(s){return s.toLowerCase()});

  function _divisorsForLevel(level){
    return level % 2 === 1 ? { divisorLon: 64, divisorLat: 32 } : { divisorLon: 32, divisorLat: 64 };
  }

  function coordsToBGrid(lat, lon, levels){
    if (!isFinite(lat) || !isFinite(lon)) throw new Error('lat/lon must be finite numbers');
    if (!(levels|0) || levels < 1 || levels !== Math.floor(levels)) throw new Error('levels must be a positive integer');
    var x = (lon + 180) / 360;
    var y = (90 - lat) / 180;
    var result = [];
    for (var i = 1; i <= levels; i++){
      var d = _divisorsForLevel(i);
      var col = Math.floor(x * d.divisorLon);
      var row = Math.floor(y * d.divisorLat);
      var index = row * d.divisorLon + col + 1;
      result.push(index);
      x = x * d.divisorLon - col;
      y = y * d.divisorLat - row;
    }
    return result;
  }

  function bgridToCell(bgridArray){
    if (!Array.isArray(bgridArray)) throw new Error('bgridArray must be an array');
    var minLon = -180, maxLon = 180;
    var minLat = -90, maxLat = 90;
    for (var i = 0; i < bgridArray.length; i++){
      var index = bgridArray[i] - 1;
      var level = i + 1;
      var d = _divisorsForLevel(level);
      var col = index % d.divisorLon;
      var row = Math.floor(index / d.divisorLon);
      var lonWidth = (maxLon - minLon) / d.divisorLon;
      var latHeight = (maxLat - minLat) / d.divisorLat;
      minLon = minLon + col * lonWidth;
      maxLon = minLon + lonWidth;
      var newMaxLat = maxLat - row * latHeight;
      var newMinLat = newMaxLat - latHeight;
      minLat = newMinLat;
      maxLat = newMaxLat;
    }
    return {
      lat: (minLat + maxLat) / 2,
      lon: (minLon + maxLon) / 2,
      bounds: [[minLat, minLon],[maxLat, maxLon]],
    };
  }

  function getGridCells(level, parentGrid, maxLevel){
    if (parentGrid === void 0) parentGrid = [];
    if (maxLevel === void 0) maxLevel = 4;
    var cells = [];
    if (level > maxLevel) return cells;
    var d = _divisorsForLevel(level);
    var total = d.divisorLon * d.divisorLat;
    for (var i = 1; i <= total; i++){
      var grid = parentGrid.concat([i]);
      var cell = bgridToCell(grid);
      cells.push({ index: i, grid: grid, center: { lat: cell.lat, lon: cell.lon }, bounds: cell.bounds });
    }
    return cells;
  }

  function isSupportedLanguage(lang){ return SUPPORTED_LANGS.indexOf(lang) !== -1; }

  function loadLanguage(langCode, opts){
    opts = opts || {};
    var basePath = opts.basePath || './bgrid-js/bip39-wordlist';
    if (!isSupportedLanguage(langCode)) throw new Error('Unsupported language: ' + langCode);
    var url = basePath.replace(/\/$/,'') + '/bip39-' + langCode + '.json';
    return fetch(url).then(function(res){
      if (!res.ok) throw new Error('Failed to fetch ' + url + ' (HTTP ' + res.status + ')');
      return res.json();
    }).then(function(words){
      if (!Array.isArray(words) || words.length !== 2048) throw new Error('Invalid bip39-' + langCode + '.json content (must be 2048 words array)');
      return words;
    });
  }

  function loadLanguages(langs, opts){
    if (!langs) langs = SUPPORTED_LANGS.slice();
    return Promise.all(langs.map(function(lc){
      return loadLanguage(lc, opts).then(function(words){ return [lc, words]; }, function(e){ return [lc, e]; });
    })).then(function(entries){
      var map = {};
      for (var i=0;i<entries.length;i++){
        var pair = entries[i];
        if (pair[1] instanceof Error) continue;
        map[pair[0]] = pair[1];
      }
      return map;
    });
  }

  function numberToWord(number, words){
    if (!Array.isArray(words) || words.length !== 2048) return null;
    if (number !== (number|0) || number < 1 || number > 2048) return null;
    return words[number - 1];
  }

  function wordToNumber(word, words){
    if (!Array.isArray(words) || words.length !== 2048) return null;
    if (!word) return null;
    var idx = words.indexOf(String(word).toLowerCase());
    return idx === -1 ? null : idx + 1;
  }

  function gridToDisplay(gridArray, opts){
    opts = opts || {};
    var mode = opts.mode || 'numbers';
    var words = opts.words;
    if (!Array.isArray(gridArray)) return '';
    if (mode === 'words'){
      if (!Array.isArray(words)) throw new Error('words array required for words mode');
      return gridArray.map(function(n){ return numberToWord(n, words); }).join(',');
    }
    return gridArray.join(',');
  }

  var api = {
    VERSION: '0.1.0',
    SUPPORTED_LANGS: SUPPORTED_LANGS,
    coordsToBGrid: coordsToBGrid,
    bgridToCell: bgridToCell,
    getGridCells: getGridCells,
    isSupportedLanguage: isSupportedLanguage,
    loadLanguage: loadLanguage,
    loadLanguages: loadLanguages,
    numberToWord: numberToWord,
    wordToNumber: wordToNumber,
    gridToDisplay: gridToDisplay,
  };

  return api;
}));
