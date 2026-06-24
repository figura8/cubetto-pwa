const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_FILES = [
  'js/core/audio-manager.js',
  'js/tutorial/tutorial-data.js',
  'src/tutorial/tutorialData.ts'
];
const SERVICE_WORKER = 'service-worker.js';
const AUDIO_ROOTS = [
  'assets/audio',
  'public/audio'
];
const AUDIO_RE = /assets\/audio\/[^'" )]+/g;
const PRECACHE_AUDIO_RE = /'\.\/(assets\/audio\/[^']+)'/g;
const SAFE_AUDIO_PATH_RE = /^(?:assets|public)\/audio\/[a-z0-9._/-]+\.(?:mp3|ogg|wav|m4a)$/;

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function collectRuntimeAudioRefs() {
  const refs = new Set();
  for (const file of SOURCE_FILES) {
    const content = read(file);
    for (const match of content.matchAll(AUDIO_RE)) {
      refs.add(match[0]);
    }
  }
  return refs;
}

function collectPrecacheAudioRefs() {
  const refs = new Set();
  const content = read(SERVICE_WORKER);
  for (const match of content.matchAll(PRECACHE_AUDIO_RE)) {
    refs.add(match[1]);
  }
  return refs;
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function fileSize(relativePath) {
  return fs.statSync(path.join(ROOT, relativePath)).size;
}

function walkFiles(relativePath, out = []) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return out;
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    out.push(relativePath.replace(/\\/g, '/'));
    return out;
  }
  if (!stat.isDirectory()) return out;
  for (const entry of fs.readdirSync(fullPath)) {
    walkFiles(path.join(relativePath, entry), out);
  }
  return out;
}

function collectAudioFiles() {
  return AUDIO_ROOTS
    .flatMap(root => walkFiles(root))
    .filter(file => /\.(mp3|ogg|wav|m4a)$/i.test(file))
    .sort();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 1024 / 102.4) / 10} MB`;
}

function diff(left, right) {
  return [...left].filter(item => !right.has(item)).sort();
}

const runtimeRefs = collectRuntimeAudioRefs();
const precacheRefs = collectPrecacheAudioRefs();
const audioFiles = collectAudioFiles();
const runtimeOrPrecacheRefs = new Set([...runtimeRefs, ...precacheRefs]);
const runtimeMissingFiles = [...runtimeRefs].filter(ref => !exists(ref)).sort();
const precacheMissingFiles = [...precacheRefs].filter(ref => !exists(ref)).sort();
const missingFromPrecache = diff(runtimeRefs, precacheRefs);
const extraPrecache = diff(precacheRefs, runtimeRefs);
const unusedAudioFiles = audioFiles.filter(file => !runtimeOrPrecacheRefs.has(file));
const unsafeRuntimeRefs = [...runtimeRefs].filter(ref => !SAFE_AUDIO_PATH_RE.test(ref)).sort();
const unsafePrecacheRefs = [...precacheRefs].filter(ref => !SAFE_AUDIO_PATH_RE.test(ref)).sort();
const unsafeAudioFiles = audioFiles.filter(file => !SAFE_AUDIO_PATH_RE.test(file));
const runtimeBytes = [...runtimeRefs]
  .filter(exists)
  .reduce((sum, ref) => sum + fileSize(ref), 0);
const unusedBytes = unusedAudioFiles
  .filter(exists)
  .reduce((sum, ref) => sum + fileSize(ref), 0);

console.log('Offline audio audit');
console.log('-------------------');
console.log(`Runtime audio refs: ${runtimeRefs.size}`);
console.log(`Precache audio refs: ${precacheRefs.size}`);
console.log(`Audio files in repo: ${audioFiles.length}`);
console.log(`Runtime audio size: ${formatBytes(runtimeBytes)}`);
console.log(`Unused audio size: ${formatBytes(unusedBytes)}`);

function printList(title, items) {
  console.log('');
  console.log(`${title}: ${items.length}`);
  items.forEach(item => console.log(`- ${item}`));
}

printList('Runtime refs missing from service worker precache', missingFromPrecache);
printList('Service worker audio refs not used by runtime sources', extraPrecache);
printList('Runtime refs missing on disk', runtimeMissingFiles);
printList('Service worker audio refs missing on disk', precacheMissingFiles);
printList('Audio files not used by runtime or precache', unusedAudioFiles);
printList('Runtime audio refs with unsafe filenames', unsafeRuntimeRefs);
printList('Service worker audio refs with unsafe filenames', unsafePrecacheRefs);
printList('Audio files with unsafe filenames', unsafeAudioFiles);

const failed = missingFromPrecache.length
  || runtimeMissingFiles.length
  || precacheMissingFiles.length
  || unusedAudioFiles.length
  || unsafeRuntimeRefs.length
  || unsafePrecacheRefs.length
  || unsafeAudioFiles.length;

if (failed) process.exitCode = 1;
