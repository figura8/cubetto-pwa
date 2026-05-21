const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const OUTPUT_PATH = path.join(ROOT, 'src', 'tutorial', 'tutorialData.ts');
const LEGACY_OUTPUT_PATH = path.join(ROOT, 'js', 'tutorial', 'tutorial-data.js');
const AUDIO_OUTPUT_DIR = path.join(ROOT, 'assets', 'audio', 'sfx', 'gameplay');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function resolveStaticPath(urlPath) {
  const normalizedPath = urlPath === '/dev/tutorial-editor'
    ? '/dev/tutorial-editor/'
    : urlPath;
  if (normalizedPath.startsWith('/audio/')) {
    return path.resolve(ROOT, 'public', normalizedPath.replace(/^\//, ''));
  }
  const relativePath = normalizedPath === '/dev/tutorial-editor/'
    ? 'dev/tutorial-editor/index.html'
    : normalizedPath === '/'
      ? 'index.html'
    : normalizedPath.replace(/^\//, '');
  const filePath = path.resolve(ROOT, relativePath);
  if (!filePath.startsWith(ROOT)) return null;
  return filePath;
}

function sanitizeFilename(filename) {
  return String(filename || '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'audio.mp3';
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

  if (req.method === 'GET' && url.pathname === '/dev/tutorial-editor/api/audio-files') {
    try {
      const files = await fs.promises.readdir(AUDIO_OUTPUT_DIR);
      const audioExts = new Set(['.mp3', '.ogg', '.wav', '.m4a']);
      const audioFiles = files.filter(f => audioExts.has(path.extname(f).toLowerCase()));
      send(res, 200, JSON.stringify(audioFiles), 'application/json; charset=utf-8');
    } catch (err) {
      send(res, 200, JSON.stringify([]), 'application/json; charset=utf-8');
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/dev/tutorial-editor/api/tutorial-data') {
    try {
      const source = await fs.promises.readFile(OUTPUT_PATH, 'utf8');
      send(res, 200, source, 'text/plain; charset=utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        send(res, 404, 'Not found');
        return;
      }
      send(res, 500, err.message);
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/dev/tutorial-editor/api/export') {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body);
      if (typeof payload.source !== 'string' || !payload.source.trim()) {
        send(res, 400, JSON.stringify({ ok: false, error: 'Missing source' }), 'application/json; charset=utf-8');
        return;
      }
      if (payload.legacySource !== undefined && typeof payload.legacySource !== 'string') {
        send(res, 400, JSON.stringify({ ok: false, error: 'Invalid legacy source' }), 'application/json; charset=utf-8');
        return;
      }
      const files = Array.isArray(payload.files) ? payload.files : [];
      const warnings = [];
      if (files.length) await fs.promises.mkdir(AUDIO_OUTPUT_DIR, { recursive: true });
      for (const file of files) {
        const filename = sanitizeFilename(file.filename);
        const target = path.join(AUDIO_OUTPUT_DIR, filename);
        if (!target.startsWith(AUDIO_OUTPUT_DIR)) continue;
        try {
          if (file.base64) {
            await fs.promises.writeFile(target, Buffer.from(file.base64, 'base64'));
          } else if (file.path) {
            await fs.promises.copyFile(path.resolve(file.path), target);
          }
        } catch (err) {
          warnings.push(`Skipped ${filename}: ${err.message}`);
        }
      }
      await fs.promises.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
      await fs.promises.writeFile(OUTPUT_PATH, payload.source, 'utf8');
      if (payload.legacySource?.trim()) {
        await fs.promises.mkdir(path.dirname(LEGACY_OUTPUT_PATH), { recursive: true });
        await fs.promises.writeFile(LEGACY_OUTPUT_PATH, payload.legacySource, 'utf8');
      }
      send(res, 200, JSON.stringify({
        ok: true,
        path: path.relative(ROOT, OUTPUT_PATH),
        legacyPath: path.relative(ROOT, LEGACY_OUTPUT_PATH),
        warnings
      }), 'application/json; charset=utf-8');
    } catch (err) {
      send(res, 500, JSON.stringify({ ok: false, error: err.message }), 'application/json; charset=utf-8');
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/dev/tutorial-editor/api/local-audio') {
    const sourcePath = url.searchParams.get('path') || '';
    try {
      const filePath = path.isAbsolute(sourcePath)
        ? path.resolve(sourcePath)
        : path.resolve(ROOT, sourcePath);
      if (!filePath.startsWith(ROOT)) {
        send(res, 403, 'Forbidden');
        return;
      }
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) {
        send(res, 404, 'Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'audio/mpeg',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(filePath).pipe(res);
    } catch (_err) {
      send(res, 404, 'Not found');
    }
    return;
  }

  if (req.method !== 'GET') {
    send(res, 405, 'Method not allowed');
    return;
  }

  const filePath = resolveStaticPath(url.pathname);
  if (!filePath) {
    send(res, 403, 'Forbidden');
    return;
  }

  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) {
      send(res, 404, 'Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    send(res, err.code === 'ENOENT' ? 404 : 500, err.code === 'ENOENT' ? 'Not found' : err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Tutorial editor: http://${HOST}:${PORT}/dev/tutorial-editor`);
});
