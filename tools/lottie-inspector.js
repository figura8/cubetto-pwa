(() => {
  const LOCAL_LOTTIE_SCRIPT = '../js/vendor/lottie.min.js';
  const LOTTIE_FALLBACKS = [
    'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js',
    'https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js'
  ];
  const ANGLES = {
    right: 0,
    down: 90,
    left: 180,
    up: -90
  };
  const TRACK_TIME_KEYS = new Set(['ip', 'op', 'st', 't', 'tm']);

  const els = {
    srcPathInput: document.getElementById('srcPathInput'),
    loadPathBtn: document.getElementById('loadPathBtn'),
    reloadBtn: document.getElementById('reloadBtn'),
    fileInput: document.getElementById('fileInput'),
    status: document.getElementById('status'),
    segmentStartInput: document.getElementById('segmentStartInput'),
    segmentEndInput: document.getElementById('segmentEndInput'),
    speedInput: document.getElementById('speedInput'),
    markerDeltaInput: document.getElementById('markerDeltaInput'),
    orientationOffsetInput: document.getElementById('orientationOffsetInput'),
    loopInput: document.getElementById('loopInput'),
    autoplayInput: document.getElementById('autoplayInput'),
    reverseInput: document.getElementById('reverseInput'),
    playSegmentBtn: document.getElementById('playSegmentBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    stopBtn: document.getElementById('stopBtn'),
    trimIpOpBtn: document.getElementById('trimIpOpBtn'),
    normalizeZeroBtn: document.getElementById('normalizeZeroBtn'),
    resetJsonBtn: document.getElementById('resetJsonBtn'),
    downloadJsonBtn: document.getElementById('downloadJsonBtn'),
    lottiePlayer: document.getElementById('lottiePlayer'),
    metaList: document.getElementById('metaList'),
    sourceLabel: document.getElementById('sourceLabel'),
    verdictBox: document.getElementById('verdictBox'),
    issuesBox: document.getElementById('issuesBox')
  };

  const state = {
    lottieLoaded: false,
    lottieLoading: false,
    runtimeError: '',
    sourcePath: '',
    sourceLabel: '',
    fileName: '',
    originalData: null,
    workingData: null,
    report: null,
    animation: null
  };

  function setStatus(message, isError = false) {
    els.status.textContent = message || '';
    els.status.classList.toggle('error', !!isError);
  }

  function deepClone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function readNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round3(value) {
    return Math.round(value * 1000) / 1000;
  }

  function fmt(value) {
    return Number.isFinite(value) ? String(round3(value)) : '-';
  }

  function wrapAngle(angle) {
    let value = angle;
    while (value > 180) value -= 360;
    while (value <= -180) value += 360;
    return value;
  }

  function angleToDirection(angle, tolerance = 35, orientationOffset = 0) {
    if (!Number.isFinite(angle)) return null;
    const calibrated = wrapAngle(angle - orientationOffset);
    let bestDir = null;
    let bestDist = Number.POSITIVE_INFINITY;
    Object.entries(ANGLES).forEach(([dir, target]) => {
      const dist = Math.abs(wrapAngle(calibrated - target));
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = dir;
      }
    });
    return bestDist <= tolerance ? bestDir : null;
  }

  function escapeHtml(value = '') {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function baseNameFromPath(path = '') {
    const clean = String(path || '').trim().replace(/\\/g, '/');
    if (!clean) return '';
    const parts = clean.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  async function loadScript(src) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Script non caricato: ${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensureLottieRuntime() {
    if (window.lottie) {
      state.lottieLoaded = true;
      return true;
    }
    if (state.lottieLoaded) return true;
    if (state.lottieLoading) return false;

    state.lottieLoading = true;
    const localUrl = new URL(LOCAL_LOTTIE_SCRIPT, window.location.href).toString();
    const candidates = [localUrl, ...LOTTIE_FALLBACKS];
    for (const src of candidates) {
      try {
        await loadScript(src);
        if (window.lottie) {
          state.lottieLoaded = true;
          state.runtimeError = '';
          state.lottieLoading = false;
          return true;
        }
      } catch (_err) {
        // try next
      }
    }
    state.runtimeError = 'Runtime Lottie non disponibile. Controlla connessione o aggiungi js/vendor/lottie.min.js nel progetto.';
    state.lottieLoading = false;
    return false;
  }

  function collectKeyframeTimes(node, out) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(item => collectKeyframeTimes(item, out));
      return;
    }
    if (typeof node !== 'object') return;
    if (node.a === 1 && Array.isArray(node.k)) {
      node.k.forEach(kf => {
        const t = Number(kf && kf.t);
        if (Number.isFinite(t)) out.push(t);
      });
    }
    Object.values(node).forEach(value => collectKeyframeTimes(value, out));
  }

  function parseRotationTrack(candidate) {
    if (!candidate || typeof candidate !== 'object') return [];
    if (candidate.a === 0) {
      const raw = Array.isArray(candidate.k) ? candidate.k[0] : candidate.k;
      const value = Number(raw);
      return Number.isFinite(value) ? [{ t: 0, v: value }] : [];
    }
    if (candidate.a === 1 && Array.isArray(candidate.k)) {
      return candidate.k
        .map(entry => {
          const time = Number(entry && entry.t);
          const rawValue = Array.isArray(entry && entry.s) ? entry.s[0] : entry && entry.s;
          const value = Number(rawValue);
          return Number.isFinite(time) && Number.isFinite(value) ? { t: time, v: value } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.t - b.t);
    }
    return [];
  }

  function collectRotationTracks(node, out, path = 'root') {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => collectRotationTracks(item, out, `${path}[${index}]`));
      return;
    }
    Object.entries(node).forEach(([key, value]) => {
      const nextPath = `${path}.${key}`;
      if (key === 'r' && value && typeof value === 'object') {
        const entries = parseRotationTrack(value);
        if (entries.length) out.push({ path: nextPath, entries, animated: value.a === 1 });
      }
      collectRotationTracks(value, out, nextPath);
    });
  }

  function sampleTrack(entries, time) {
    if (!entries || !entries.length) return NaN;
    if (entries.length === 1) return entries[0].v;
    if (!Number.isFinite(time)) return entries[0].v;
    if (time <= entries[0].t) return entries[0].v;
    if (time >= entries[entries.length - 1].t) return entries[entries.length - 1].v;
    for (let i = 0; i < entries.length - 1; i += 1) {
      const a = entries[i];
      const b = entries[i + 1];
      if (time < a.t || time > b.t) continue;
      const span = b.t - a.t;
      if (span <= 0.0001) return a.v;
      const ratio = (time - a.t) / span;
      return a.v + (b.v - a.v) * ratio;
    }
    return entries[entries.length - 1].v;
  }

  function analyzeLottie(data, fileName = '', markerDelta = 0.5, orientationOffset = 0) {
    const issues = [];
    const report = {
      severity: 'good',
      fr: NaN,
      ip: NaN,
      op: NaN,
      durationMs: NaN,
      keyframes: [],
      layerCount: 0,
      segmentStart: NaN,
      segmentEnd: NaN,
      rotationStartDir: null,
      rotationEndDir: null,
      rotationTrackPath: ''
    };

    function addIssue(level, title, detail) {
      issues.push({ level, title, detail });
    }

    if (!data || typeof data !== 'object') {
      addIssue('bad', 'JSON non valido', 'Il file non contiene un oggetto Lottie valido.');
      return { ...report, issues, severity: 'bad' };
    }

    report.fr = Number(data.fr);
    report.ip = Number(data.ip);
    report.op = Number(data.op);
    report.layerCount = Array.isArray(data.layers) ? data.layers.length : 0;

    if (!Number.isFinite(report.fr) || report.fr <= 0) {
      addIssue('bad', 'Framerate mancante', 'Il campo fr deve essere un numero > 0.');
    }
    if (!Number.isFinite(report.ip) || !Number.isFinite(report.op)) {
      addIssue('bad', 'Range mancante', 'I campi ip e op devono essere numerici.');
    } else if (report.op <= report.ip) {
      addIssue('bad', 'Range non valido', 'op deve essere maggiore di ip.');
    } else if (Number.isFinite(report.fr) && report.fr > 0) {
      report.durationMs = Math.round(((report.op - report.ip) / report.fr) * 1000);
    }

    if (report.layerCount === 0) {
      addIssue('bad', 'Nessun layer', 'Il file non contiene layers.');
    }

    const keyframes = [];
    collectKeyframeTimes(data.layers, keyframes);
    report.keyframes = [...new Set(keyframes.map(t => Number(t)).filter(Number.isFinite))].sort((a, b) => a - b);

    if (!report.keyframes.length) {
      addIssue('warn', 'Nessun keyframe animato', 'Il file sembra statico o con proprieta non animate.');
    } else if (Number.isFinite(report.ip) && Number.isFinite(report.op)) {
      const minKf = report.keyframes[0];
      const maxKf = report.keyframes[report.keyframes.length - 1];
      if (minKf < report.ip - markerDelta) {
        addIssue('warn', 'Keyframe prima di ip', `Min keyframe ${minKf} < ip ${report.ip}.`);
      }
      if (maxKf > report.op + markerDelta) {
        addIssue('warn', 'Keyframe dopo op', `Max keyframe ${maxKf} > op ${report.op}.`);
      }

      const beforeStart = report.keyframes.filter(t => t <= report.ip + markerDelta);
      const afterEnd = report.keyframes.filter(t => t >= report.op - markerDelta);
      report.segmentStart = beforeStart.length ? beforeStart[beforeStart.length - 1] : report.keyframes[0];
      report.segmentEnd = afterEnd.length ? afterEnd[0] : report.keyframes[report.keyframes.length - 1];

      if (Math.abs(report.segmentStart - report.ip) > markerDelta) {
        addIssue('warn', 'Start non allineato', `ip=${report.ip} ma keyframe vicino start=${report.segmentStart}.`);
      }
      if (Math.abs(report.segmentEnd - report.op) > markerDelta) {
        addIssue('warn', 'End non allineato', `op=${report.op} ma keyframe vicino end=${report.segmentEnd}.`);
      }
    }

    if (Number.isFinite(report.ip) && Math.abs(report.ip) > markerDelta) {
      addIssue('warn', 'Animazione non parte da 0', `ip=${report.ip}. Puoi usare "Porta start a 0".`);
    } else if (Number.isFinite(report.ip)) {
      addIssue('good', 'Start ok', 'ip parte da 0 (o molto vicino).');
    }

    const rotationTracks = [];
    collectRotationTracks(data.layers, rotationTracks);
    const chosenTrack = rotationTracks.find(track => track.animated) || rotationTracks[0] || null;
    if (chosenTrack) {
      report.rotationTrackPath = chosenTrack.path;
      const sampleStartAt = Number.isFinite(report.ip) ? report.ip : chosenTrack.entries[0].t;
      const sampleEndAt = Number.isFinite(report.op) ? (report.op - 0.01) : chosenTrack.entries[chosenTrack.entries.length - 1].t;
      const startAngle = sampleTrack(chosenTrack.entries, sampleStartAt);
      const endAngle = sampleTrack(chosenTrack.entries, sampleEndAt);
      report.rotationStartDir = angleToDirection(startAngle, 35, orientationOffset);
      report.rotationEndDir = angleToDirection(endAngle, 35, orientationOffset);

      const lowerName = String(fileName || '').toLowerCase();
      const idleMatch = /_idle_(right|left|up|down)\.json$/.exec(lowerName);
      if (idleMatch) {
        const expected = idleMatch[1];
        if (report.rotationStartDir && report.rotationStartDir !== expected) {
          addIssue('warn', 'Idle naming sospetto', `${fileName}: atteso ${expected}, ma posa sembra ${report.rotationStartDir}.`);
        } else if (report.rotationStartDir) {
          addIssue('good', 'Idle naming ok', `${fileName}: direzione coerente (${expected}).`);
        }
      }

      const turnMatch = /_turn_(right|left|up|down)_to_(right|left|up|down)\.json$/.exec(lowerName);
      if (turnMatch) {
        const expectedFrom = turnMatch[1];
        const expectedTo = turnMatch[2];
        if (report.rotationStartDir && report.rotationEndDir) {
          if (report.rotationStartDir !== expectedFrom || report.rotationEndDir !== expectedTo) {
            addIssue(
              'warn',
              'Turn naming sospetto',
              `${fileName}: atteso ${expectedFrom}->${expectedTo}, ma sembra ${report.rotationStartDir}->${report.rotationEndDir} con ip/op attuali.`
            );
          } else {
            addIssue('good', 'Turn naming ok', `${fileName}: transizione coerente (${expectedFrom}->${expectedTo}).`);
          }
        }
      }
    } else {
      addIssue('warn', 'Nessuna traccia rotazione', 'Non trovo una proprieta r valida nei layer.');
    }

    const hasBad = issues.some(item => item.level === 'bad');
    const hasWarn = issues.some(item => item.level === 'warn');
    report.severity = hasBad ? 'bad' : (hasWarn ? 'warn' : 'good');
    report.issues = issues;
    return report;
  }

  function readSegmentInputs() {
    const start = readNumber(els.segmentStartInput.value, 0);
    const end = readNumber(els.segmentEndInput.value, start + 1);
    if (end <= start) return null;
    return { start, end };
  }

  function applyNumberInputsFromRange(start, end) {
    els.segmentStartInput.value = String(round3(start));
    els.segmentEndInput.value = String(round3(end));
  }

  function updateMeta(report) {
    const list = [];
    const fileName = state.fileName || '-';
    list.push(`<li><strong>File:</strong> <span class="code">${escapeHtml(fileName)}</span></li>`);
    list.push(`<li><strong>ip/op/fr:</strong> ${fmt(report.ip)} / ${fmt(report.op)} / ${fmt(report.fr)}</li>`);
    list.push(`<li><strong>Durata:</strong> ${Number.isFinite(report.durationMs) ? `${report.durationMs} ms` : '-'}</li>`);
    list.push(`<li><strong>Layers:</strong> ${report.layerCount}</li>`);
    list.push(`<li><strong>Keyframes:</strong> ${report.keyframes.length}</li>`);
    if (report.keyframes.length) {
      list.push(`<li><strong>KF range:</strong> ${fmt(report.keyframes[0])} -> ${fmt(report.keyframes[report.keyframes.length - 1])}</li>`);
    }
    list.push(`<li><strong>Start suggerito:</strong> ${fmt(report.segmentStart)}</li>`);
    list.push(`<li><strong>End suggerito:</strong> ${fmt(report.segmentEnd)}</li>`);
    if (report.rotationTrackPath) {
      const from = report.rotationStartDir || '?';
      const to = report.rotationEndDir || '?';
      list.push(`<li><strong>Rotazione:</strong> ${from} -> ${to}</li>`);
    }
    list.push(`<li><strong>Offset orientamento:</strong> ${fmt(readNumber(els.orientationOffsetInput.value, 0))} deg</li>`);
    els.metaList.innerHTML = list.join('');
  }

  function updateVerdict(report) {
    els.verdictBox.className = `verdict ${report.severity}`;
    if (report.severity === 'good') {
      els.verdictBox.textContent = 'Validazione OK. File coerente con range attuale.';
    } else if (report.severity === 'warn') {
      els.verdictBox.textContent = 'Validazione con warning. Il file puo funzionare, ma conviene correggere range/naming/segmento.';
    } else {
      els.verdictBox.textContent = 'Validazione con errori. Correggi i campi base (ip/op/fr/layers) prima del test in gioco.';
    }
  }

  function updateIssues(report) {
    if (!report.issues.length) {
      els.issuesBox.innerHTML = '<div class="issue good"><strong>Nessun problema trovato</strong>Tutto allineato sui controlli base.</div>';
      return;
    }
    els.issuesBox.innerHTML = report.issues
      .map(issue => {
        const cls = issue.level === 'bad' ? 'bad' : (issue.level === 'warn' ? 'warn' : 'good');
        return `<div class="issue ${cls}"><strong>${escapeHtml(issue.title)}</strong>${escapeHtml(issue.detail || '')}</div>`;
      })
      .join('');
  }

  function applyAnalysis(syncSegmentInputs = false) {
    if (!state.workingData) {
      els.metaList.innerHTML = '';
      els.verdictBox.className = 'verdict';
      els.verdictBox.textContent = 'Carica un file per avviare la validazione.';
      els.issuesBox.innerHTML = '<div class="issue">Nessuna analisi disponibile.</div>';
      return;
    }
    const delta = Math.max(0.05, readNumber(els.markerDeltaInput.value, 0.5));
    const orientationOffset = readNumber(els.orientationOffsetInput.value, 0);
    const report = analyzeLottie(state.workingData, state.fileName, delta, orientationOffset);
    state.report = report;
    if (syncSegmentInputs) {
      const start = Number.isFinite(report.ip) ? report.ip : 0;
      const end = Number.isFinite(report.op) && report.op > start ? report.op : (start + 1);
      applyNumberInputsFromRange(start, end);
    }
    updateMeta(report);
    updateVerdict(report);
    updateIssues(report);
  }

  function destroyPlayer() {
    if (state.animation && typeof state.animation.destroy === 'function') {
      state.animation.destroy();
    }
    state.animation = null;
    els.lottiePlayer.innerHTML = '';
  }

  function applyRuntimeParams() {
    if (!state.animation) return;
    const speed = clamp(readNumber(els.speedInput.value, 1), 0.1, 4);
    state.animation.setSpeed(speed);
    state.animation.loop = !!els.loopInput.checked;
  }

  function playSelectedSegment() {
    if (!state.animation) return;
    const segment = readSegmentInputs();
    if (!segment) {
      setStatus('Segmento non valido: end deve essere maggiore di start.', true);
      return;
    }
    applyRuntimeParams();
    const reverse = !!els.reverseInput.checked;
    if (typeof state.animation.setDirection === 'function') {
      state.animation.setDirection(reverse ? -1 : 1);
    }
    const from = reverse ? segment.end : segment.start;
    state.animation.goToAndStop(from, true);
    if (typeof state.animation.playSegments === 'function') {
      state.animation.playSegments([segment.start, segment.end], true);
    } else {
      state.animation.play();
    }
  }

  async function rebuildPlayer() {
    destroyPlayer();
    if (!state.workingData) return;
    const ok = await ensureLottieRuntime();
    if (!ok || !window.lottie) {
      setStatus(state.runtimeError || 'Runtime Lottie non disponibile.', true);
      return;
    }

    state.animation = window.lottie.loadAnimation({
      container: els.lottiePlayer,
      renderer: 'svg',
      loop: !!els.loopInput.checked,
      autoplay: false,
      animationData: deepClone(state.workingData)
    });
    state.animation.addEventListener('DOMLoaded', () => {
      applyRuntimeParams();
      const segment = readSegmentInputs();
      if (!segment) return;
      state.animation.goToAndStop(segment.start, true);
      if (els.autoplayInput.checked) {
        playSelectedSegment();
      }
    });
  }

  function applyLoadedData(data, sourceLabel, fileName) {
    state.sourceLabel = sourceLabel || '';
    state.fileName = fileName || 'animation.json';
    state.originalData = deepClone(data);
    state.workingData = deepClone(data);
    state.sourcePath = sourceLabel || '';
    els.sourceLabel.textContent = sourceLabel ? `Sorgente: ${sourceLabel}` : 'Sorgente locale';
    applyAnalysis(true);
    rebuildPlayer();
  }

  async function parseAndLoadText(rawText, sourceLabel, fileName) {
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (_err) {
      setStatus('JSON non valido: impossibile fare parse.', true);
      return;
    }
    if (!parsed || typeof parsed !== 'object') {
      setStatus('JSON non valido: oggetto vuoto o formato errato.', true);
      return;
    }
    applyLoadedData(parsed, sourceLabel, fileName);
    setStatus(`File caricato: ${fileName || sourceLabel}`);
  }

  function resolveProjectUrl(rawPath) {
    const clean = String(rawPath || '').trim();
    if (!clean) return '';
    if (/^https?:\/\//i.test(clean)) return clean;
    const rootBase = new URL('../', window.location.href);
    return new URL(clean.replace(/^\.\/+/, ''), rootBase).toString();
  }

  async function loadFromPath() {
    const path = String(els.srcPathInput.value || '').trim();
    if (!path) {
      setStatus('Inserisci un path JSON del progetto.', true);
      return;
    }
    try {
      const targetUrl = resolveProjectUrl(path);
      const response = await fetch(targetUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      await parseAndLoadText(text, path, baseNameFromPath(path) || 'animation.json');
    } catch (err) {
      setStatus(`Caricamento fallito (${err.message || 'errore sconosciuto'}).`, true);
    }
  }

  async function loadFromLocalFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      await parseAndLoadText(text, `locale: ${file.name}`, file.name);
    } catch (_err) {
      setStatus('Impossibile leggere il file locale.', true);
    }
  }

  function trimToSegment() {
    if (!state.workingData) return;
    const segment = readSegmentInputs();
    if (!segment) {
      setStatus('Segmento non valido: end deve essere maggiore di start.', true);
      return;
    }
    const next = deepClone(state.workingData);
    next.ip = round3(segment.start);
    next.op = round3(segment.end);
    if (Array.isArray(next.layers)) {
      next.layers.forEach(layer => {
        if (!layer || typeof layer !== 'object') return;
        if (Number.isFinite(layer.ip)) layer.ip = round3(clamp(layer.ip, segment.start, segment.end));
        if (Number.isFinite(layer.op)) layer.op = round3(clamp(layer.op, segment.start, segment.end));
        if (Number.isFinite(layer.st)) layer.st = round3(clamp(layer.st, segment.start, segment.end));
        if (Number.isFinite(layer.ip) && Number.isFinite(layer.op) && layer.op <= layer.ip) {
          layer.op = round3(layer.ip + 1);
        }
      });
    }
    state.workingData = next;
    applyAnalysis(false);
    rebuildPlayer();
    setStatus(`ip/op aggiornati a ${fmt(segment.start)} -> ${fmt(segment.end)}.`);
  }

  function shiftTimeline(node, offset) {
    if (Array.isArray(node)) {
      node.forEach(item => shiftTimeline(item, offset));
      return;
    }
    if (!node || typeof node !== 'object') return;
    Object.keys(node).forEach(key => {
      const value = node[key];
      if (TRACK_TIME_KEYS.has(key) && Number.isFinite(value)) {
        node[key] = round3(value - offset);
        return;
      }
      shiftTimeline(value, offset);
    });
  }

  function normalizeToZero() {
    if (!state.workingData) return;
    const segment = readSegmentInputs();
    if (!segment) {
      setStatus('Segmento non valido: end deve essere maggiore di start.', true);
      return;
    }
    const offset = segment.start;
    if (Math.abs(offset) < 0.0001) {
      setStatus('Start gia a zero: nessuna normalizzazione necessaria.');
      return;
    }
    const next = deepClone(state.workingData);
    shiftTimeline(next, offset);
    state.workingData = next;
    applyNumberInputsFromRange(segment.start - offset, segment.end - offset);
    applyAnalysis(false);
    rebuildPlayer();
    setStatus(`Timeline normalizzata: -${fmt(offset)} frame.`);
  }

  function resetToOriginal() {
    if (!state.originalData) return;
    state.workingData = deepClone(state.originalData);
    applyAnalysis(true);
    rebuildPlayer();
    setStatus('Ripristinato JSON originale.');
  }

  function buildDownloadName(fileName) {
    const clean = String(fileName || 'animation.json').trim();
    if (!clean.toLowerCase().endsWith('.json')) return `${clean}.json`;
    return `${clean.slice(0, -5)}.fixed.json`;
  }

  function downloadCurrentJson() {
    if (!state.workingData) return;
    const fileName = buildDownloadName(state.fileName);
    const blob = new Blob([`${JSON.stringify(state.workingData, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus(`Scaricato: ${fileName}`);
  }

  function onRuntimeInputsChanged() {
    applyAnalysis(false);
    applyRuntimeParams();
  }

  els.loadPathBtn.addEventListener('click', loadFromPath);
  els.reloadBtn.addEventListener('click', () => {
    if (!state.sourceLabel) {
      setStatus('Nessuna sorgente da ricaricare.', true);
      return;
    }
    const fromPath = !String(state.sourceLabel).startsWith('locale:');
    if (fromPath) {
      els.srcPathInput.value = state.sourceLabel;
      loadFromPath();
      return;
    }
    resetToOriginal();
  });

  els.fileInput.addEventListener('change', event => {
    const file = event.target && event.target.files && event.target.files[0];
    loadFromLocalFile(file);
  });

  els.playSegmentBtn.addEventListener('click', playSelectedSegment);
  els.pauseBtn.addEventListener('click', () => state.animation && state.animation.pause());
  els.resumeBtn.addEventListener('click', () => state.animation && state.animation.play());
  els.stopBtn.addEventListener('click', () => {
    if (!state.animation) return;
    const segment = readSegmentInputs();
    if (!segment) return;
    state.animation.pause();
    state.animation.goToAndStop(segment.start, true);
  });

  els.trimIpOpBtn.addEventListener('click', trimToSegment);
  els.normalizeZeroBtn.addEventListener('click', normalizeToZero);
  els.resetJsonBtn.addEventListener('click', resetToOriginal);
  els.downloadJsonBtn.addEventListener('click', downloadCurrentJson);

  [
    els.segmentStartInput,
    els.segmentEndInput,
    els.speedInput,
    els.loopInput,
    els.autoplayInput,
    els.reverseInput,
    els.markerDeltaInput,
    els.orientationOffsetInput
  ].forEach(input => {
    input.addEventListener('input', onRuntimeInputsChanged);
    input.addEventListener('change', onRuntimeInputsChanged);
  });

  els.srcPathInput.value = 'assets/animations/characters/boks_black/boks_black_turn_right_to_up.json';
  setStatus('Pronto. Carica un file Lottie per iniziare.');
})();
