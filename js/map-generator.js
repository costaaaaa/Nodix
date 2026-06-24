(function () {
  'use strict';

  // --- Stato globale ---
  var mm = null;
  var currentRoot = null;
  var debounceTimer = null;
  var currentOptions = {
    spacingHorizontal: 80,
    spacingVertical: 5,
    initialExpandLevel: 2,
    colorFreezeLevel: 2,
    duration: 500,
    paddingX: 8,
    maxWidth: 300,
  };

  // --- Utility ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getTextareaId() {
    if (document.getElementById('textInput')) return 'textInput';
    if (document.getElementById('content')) return 'content';
    return null;
  }

  function getTitleValue() {
    var el = document.getElementById('mapTitleInput');
    return (el && el.value.trim()) ? el.value.trim() : 'Mappa';
  }

  function getTextValue() {
    var id = getTextareaId();
    if (!id) return '';
    return document.getElementById(id).value;
  }

  // --- Costruzione albero da outline ---
  // Ogni 4 spazi = 1 livello di annidamento.
  // La radice è il titolo (livello 0); le righe top-level (0 spazi) diventano livello 1.
  function buildTree(title, text) {
    var root = { content: escapeHtml(title || 'Mappa'), children: [], payload: {} };
    if (!text || !text.trim()) return root;

    var lines = text.split('\n').filter(function (l) { return l.trim() !== ''; });
    var stack = [{ node: root, depth: 0 }];

    lines.forEach(function (line) {
      var indentLen = (line.match(/^\s*/) || [''])[0].length;
      var depth = Math.floor(indentLen / 4) + 1;
      var label = escapeHtml(line.trim().replace(/^[•\-\*]\s*/, ''));
      var node = { content: label, children: [], payload: {} };

      while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }
      stack[stack.length - 1].node.children.push(node);
      stack.push({ node: node, depth: depth });
    });

    return root;
  }

  // --- Fold state ---
  function applyFoldPaths(root, foldedPaths) {
    if (!foldedPaths || !foldedPaths.length) return;
    var pathSet = {};
    foldedPaths.forEach(function (p) { pathSet[p] = true; });

    function walk(node, path) {
      if (pathSet[path.join('/')]) {
        node.payload = node.payload || {};
        node.payload.fold = 1;
      }
      (node.children || []).forEach(function (child, i) {
        walk(child, path.concat(i));
      });
    }
    walk(root, []);
  }

  function collectFoldedPaths(root) {
    var folded = [];
    function walk(node, path) {
      if (node.payload && node.payload.fold === 1) {
        folded.push(path.join('/'));
      }
      (node.children || []).forEach(function (child, i) {
        walk(child, path.concat(i));
      });
    }
    walk(root, []);
    return folded;
  }

  // --- Init / refresh mappa ---
  function getOrCreateSvg() {
    var container = document.getElementById('mapContainer');
    if (!container) return null;
    var svg = container.querySelector('svg.markmap-svg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('markmap-svg');
      svg.style.width = '100%';
      svg.style.height = '100%';
      container.innerHTML = '';
      container.appendChild(svg);
    }
    return svg;
  }

  function initMap(root, opts) {
    if (!window.markmap || !window.markmap.Markmap) {
      console.error('markmap-view non disponibile');
      return;
    }
    var svg = getOrCreateSvg();
    if (!svg) return;

    if (mm) { try { mm.destroy(); } catch (e) {} mm = null; }

    currentRoot = root;
    mm = window.markmap.Markmap.create(svg, opts || currentOptions, root);
  }

  function refreshMap() {
    var title = getTitleValue();
    var text = getTextValue();
    var root = buildTree(title, text);
    currentRoot = root;

    if (!mm) {
      initMap(root, currentOptions);
    } else {
      mm.setData(root, currentOptions);
      mm.fit();
    }
  }

  // --- Controllo distanza nodi (→ spacingHorizontal) ---
  function setupNodeDistance() {
    var input = document.getElementById('nodeDistanceValue');
    if (!input) return;
    input.value = currentOptions.spacingHorizontal;

    function apply(val) {
      val = Math.max(20, Math.min(400, parseInt(val) || 80));
      input.value = val;
      currentOptions.spacingHorizontal = val;
      currentOptions.spacingVertical = Math.round(val * 0.06);
      if (mm && currentRoot) {
        mm.setData(currentRoot, currentOptions);
        mm.fit();
      }
    }

    var plus = document.getElementById('nodeDistancePlus');
    var minus = document.getElementById('nodeDistanceMinus');
    if (plus) plus.addEventListener('click', function () { apply(parseInt(input.value) + 10); });
    if (minus) minus.addEventListener('click', function () { apply(parseInt(input.value) - 10); });
    input.addEventListener('change', function () { apply(input.value); });
  }

  // --- Controllo livello espansione ---
  function updateExpandDisplay() {
    var el = document.getElementById('expandLevelDisplay');
    if (el) {
      el.textContent = currentOptions.initialExpandLevel === -1
        ? '∞' : String(currentOptions.initialExpandLevel);
    }
  }

  function applyExpandLevel(newLevel) {
    currentOptions.initialExpandLevel = newLevel;
    updateExpandDisplay();
    if (currentRoot) {
      // Ricostruisce: l'initialExpandLevel viene applicato al primo render
      if (mm) { try { mm.destroy(); } catch (e) {} mm = null; }
      var svg = getOrCreateSvg();
      if (!svg) return;
      // Pulisce il fold payload dal root (altrimenti vince sul initialExpandLevel)
      clearFoldPayload(currentRoot);
      mm = window.markmap.Markmap.create(svg, currentOptions, currentRoot);
    }
  }

  function clearFoldPayload(node) {
    if (node.payload) delete node.payload.fold;
    (node.children || []).forEach(clearFoldPayload);
  }

  function setupExpandLevel() {
    updateExpandDisplay();

    var plus = document.getElementById('expandLevelPlus');
    var minus = document.getElementById('expandLevelMinus');
    var expandAll = document.getElementById('expandAllBtn');
    var collapseAll = document.getElementById('collapseAllBtn');

    if (plus) plus.addEventListener('click', function () {
      var cur = currentOptions.initialExpandLevel;
      applyExpandLevel(cur === -1 ? -1 : Math.min(10, cur + 1));
    });
    if (minus) minus.addEventListener('click', function () {
      var cur = currentOptions.initialExpandLevel;
      applyExpandLevel(cur === -1 ? 5 : Math.max(1, cur - 1));
    });
    if (expandAll) expandAll.addEventListener('click', function () { applyExpandLevel(-1); });
    if (collapseAll) collapseAll.addEventListener('click', function () { applyExpandLevel(1); });
  }

  // --- Zoom ---
  function setupZoom() {
    var zIn = document.getElementById('zoomIn');
    var zOut = document.getElementById('zoomOut');
    var fit = document.getElementById('fitMapBtn');

    if (zIn) zIn.addEventListener('click', function () { if (mm) mm.rescale(1.25); });
    if (zOut) zOut.addEventListener('click', function () { if (mm) mm.rescale(0.8); });
    if (fit) fit.addEventListener('click', function () { if (mm) mm.fit(); });
  }

  // --- Fullscreen ---
  function setupFullscreen() {
    var btn = document.getElementById('fullscreenBtn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var el = document.querySelector('.concept-map');
      if (!el) return;
      var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs) {
        var req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) req.call(el);
      } else {
        var exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (exit) exit.call(document);
      }
    });

    function onFsChange() {
      var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      btn.innerHTML = isFs
        ? '<i class="bi bi-fullscreen-exit"></i>'
        : '<i class="bi bi-arrows-fullscreen"></i>';
      setTimeout(function () { if (mm) mm.fit(); }, 200);
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
  }

  // --- Export ---
  function setupExport() {
    var pngBtn = document.getElementById('exportPNG');
    var pdfBtn = document.getElementById('exportPDF');
    if (pngBtn) pngBtn.addEventListener('click', function (e) { e.preventDefault(); doExport('png'); });
    if (pdfBtn) pdfBtn.addEventListener('click', function (e) { e.preventDefault(); doExport('pdf'); });
  }

  function doExport(format) {
    if (!mm) return;
    var container = document.getElementById('mapContainer');
    var svgEl = container && container.querySelector('svg');
    if (!svgEl) return;

    var w = svgEl.clientWidth || 800;
    var h = svgEl.clientHeight || 600;
    var scale = 2;

    try {
      var clone = svgEl.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('xmlns:xhtml', 'http://www.w3.org/1999/xhtml');
      clone.setAttribute('width', w);
      clone.setAttribute('height', h);

      // Stili minimi inline per l'export
      var styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleEl.textContent = [
        'text, div { font-family: sans-serif; font-size: 14px; }',
        'circle { stroke-width: 1.5px; }',
        'path { fill: none; stroke-width: 1.5px; }',
      ].join(' ');
      clone.insertBefore(styleEl, clone.firstChild);

      var svgStr = new XMLSerializer().serializeToString(clone);
      var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();

      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = w * scale;
        canvas.height = h * scale;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        try {
          ctx.drawImage(img, 0, 0, w, h);
          saveCanvas(canvas, format);
        } catch (err) {
          // Canvas tainted: fallback html2canvas
          fallbackExport(container, format);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        fallbackExport(container, format);
      };
      img.src = url;
    } catch (e) {
      fallbackExport(container, format);
    }
  }

  function fallbackExport(container, format) {
    if (typeof html2canvas === 'undefined') {
      alert('Esportazione non supportata in questo browser.');
      return;
    }
    html2canvas(container, { backgroundColor: 'white', scale: 2, logging: false, useCORS: true })
      .then(function (canvas) { saveCanvas(canvas, format); });
  }

  function saveCanvas(canvas, format) {
    if (format === 'png') {
      var a = document.createElement('a');
      a.download = 'mappa-concettuale.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    } else {
      var imgData = canvas.toDataURL('image/png');
      var w = canvas.width / 2;
      var h = canvas.height / 2;
      var pdf = new jspdf.jsPDF({
        orientation: w > h ? 'landscape' : 'portrait',
        unit: 'px',
        format: [w, h],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save('mappa-concettuale.pdf');
    }
  }

  // --- Aggiornamento live ---
  function setupLiveUpdate() {
    function schedule() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(refreshMap, 350);
    }
    var taId = getTextareaId();
    if (taId) {
      var ta = document.getElementById(taId);
      if (ta) ta.addEventListener('input', schedule);
    }
    var titleInput = document.getElementById('mapTitleInput');
    if (titleInput) titleInput.addEventListener('input', schedule);
  }

  // --- Stato mappa (fold + opzioni + zoom/pan) ---
  function captureState() {
    if (!mm) return null;

    // Fold state: usa lo stato interno di markmap se disponibile, altrimenti currentRoot
    var folded = [];
    try {
      var data = (mm.state && mm.state.data) ? mm.state.data : currentRoot;
      if (data) folded = collectFoldedPaths(data);
    } catch (e) {}

    // Zoom/pan: D3 salva la transform sul nodo SVG come __zoom
    var transform = { x: 0, y: 0, k: 1 };
    try {
      var svgNode = mm.svg && mm.svg.node ? mm.svg.node() : null;
      if (svgNode && svgNode.__zoom) {
        var t = svgNode.__zoom;
        transform = { x: t.x || 0, y: t.y || 0, k: t.k || 1 };
      }
    } catch (e) {}

    return {
      initialExpandLevel: currentOptions.initialExpandLevel,
      spacing: currentOptions.spacingHorizontal,
      folded: folded,
      transform: transform,
    };
  }

  function applyState(state) {
    if (!state) return;
    if (state.initialExpandLevel !== undefined) {
      currentOptions.initialExpandLevel = state.initialExpandLevel;
    }
    if (state.spacing !== undefined) {
      currentOptions.spacingHorizontal = state.spacing;
      currentOptions.spacingVertical = Math.round(state.spacing * 0.06);
      var input = document.getElementById('nodeDistanceValue');
      if (input) input.value = state.spacing;
    }
    updateExpandDisplay();
  }

  function restoreTransform(transform) {
    if (!transform || !mm) return;
    setTimeout(function () {
      try {
        // Usa il zoom behavior interno di markmap (proprietà pubblica al runtime)
        var svgSel = mm.svg;
        var zoomBehavior = mm.zoom;
        if (svgSel && zoomBehavior && window.d3) {
          svgSel.call(
            zoomBehavior.transform,
            window.d3.zoomIdentity.translate(transform.x, transform.y).scale(transform.k)
          );
        }
      } catch (e) {}
    }, 600);
  }

  // --- Persistenza editor (form submit) ---
  function setupEditorPersistence() {
    var form = document.getElementById('textForm');
    if (!form) return;

    form.addEventListener('submit', function () {
      var state = captureState();
      var input = document.getElementById('map_state');
      if (input && state) {
        input.value = JSON.stringify(state);
      }
    });
  }

  // --- Persistenza sandbox (localStorage) ---
  function loadSandboxState() {
    try {
      var raw = localStorage.getItem('nodix_sandbox_state');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveSandboxState() {
    var state = captureState();
    if (!state) return;
    try { localStorage.setItem('nodix_sandbox_state', JSON.stringify(state)); } catch (e) {}
  }

  // --- Bootstrap ---
  document.addEventListener('DOMContentLoaded', function () {
    var isSandbox = !document.getElementById('textForm');

    // Carica lo stato salvato
    var savedState = null;
    if (!isSandbox && window.NODIX_MAP_STATE) {
      savedState = window.NODIX_MAP_STATE;
    } else if (isSandbox) {
      savedState = loadSandboxState();
      window.addEventListener('beforeunload', saveSandboxState);
    }

    // Applica le opzioni salvate prima di inizializzare i controlli
    if (savedState) applyState(savedState);

    // Inizializza tutti i controlli
    setupNodeDistance();
    setupExpandLevel();
    setupZoom();
    setupFullscreen();
    setupExport();
    setupLiveUpdate();
    setupEditorPersistence();

    // Pulsante "Genera Mappa" (refresh immediato)
    var genBtn = document.getElementById('generateMap');
    if (genBtn) genBtn.addEventListener('click', refreshMap);

    // Auto-genera la mappa se c'è già del testo (es. apertura editor su testo esistente)
    var text = getTextValue();
    if (text.trim()) {
      var title = getTitleValue();
      var root = buildTree(title, text);

      // Applica il fold state salvato prima del primo render
      if (savedState && savedState.folded && savedState.folded.length) {
        applyFoldPaths(root, savedState.folded);
      }

      initMap(root, currentOptions);

      // Ripristina lo zoom/pan dopo il render
      if (savedState && savedState.transform) {
        restoreTransform(savedState.transform);
      }
    }
  });

})();
