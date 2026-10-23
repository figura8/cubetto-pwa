const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/editor/level-storage.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const storage = context.window.BOKS_LEVEL_STORAGE({
  cols: 6, rows: 6, slots: 8, fnSlots: 4,
  customLevelTheme: 'level1', customIcons: ['star'],
  resolveDecorationAssetId: id => id
});
const entries = JSON.parse(JSON.stringify(storage.normalizeDecorations([
  { id: 'bee-1', asset: 'bee_hover', x: 2, y: 3, scale: 1.75, motion: 'orbit_cw', motionExtent: 1.4, rotation: 45, pivotX: 0.2, pivotY: 0.8 },
  { id: 'tree-1', asset: 'tree_small', x: 0, y: 1, scale: 0.3, motion: 'sway' },
  { id: 'old', asset: 'tree_small', x: 1, y: 1 },
  { id: 'bad', asset: 'tree_small', x: 1, y: 1, scale: 99, motion: 'invalid', motionExtent: 99, rotation: 900, pivotX: -1, pivotY: 2 }
])));
assert.equal(entries[0].scale, 1.75);
assert.equal(entries[0].motion, 'orbit_cw');
assert.equal(entries[0].motionExtent, 1.4);
assert.equal(entries[0].rotation, 45);
assert.equal(entries[0].pivotX, 0.2);
assert.equal(entries[0].pivotY, 0.8);
assert.equal(entries[1].scale, 0.3);
assert.equal(entries[1].motion, 'sway');
assert.equal(entries[2].scale, 1);
assert.equal(entries[2].motion, 'none');
assert.equal(entries[2].motionExtent, 1);
assert.equal(entries[3].scale, 2.5);
assert.equal(entries[3].motion, 'none');
assert.equal(entries[3].motionExtent, 2);
assert.equal(entries[3].rotation, -180);
assert.equal(entries[3].pivotX, 0);
assert.equal(entries[3].pivotY, 1);
const roundTrip = JSON.parse(JSON.stringify(storage.editorLevelToTutorialStep({
  name: 'test', icon: 'star', decorations: entries
}).decorations));
assert.equal(roundTrip[0].motion, 'orbit_cw');
assert.equal(roundTrip[0].motionExtent, 1.4);
assert.equal(roundTrip[0].rotation, 45);
assert.equal(roundTrip[0].pivotX, 0.2);
assert.equal(roundTrip[1].scale, 0.3);
const gameSource = fs.readFileSync(path.join(root, 'js/core/game.js'), 'utf8');
const poseStart = gameSource.indexOf('function decorationMotionPose(');
const poseEnd = gameSource.indexOf('\nfunction applyDecorationMotion(', poseStart);
assert.ok(poseStart >= 0 && poseEnd > poseStart);
const poseContext = {};
vm.runInNewContext(`${gameSource.slice(poseStart, poseEnd)}\nglobalThis.pose = decorationMotionPose;`, poseContext);
for (const motion of ['sweep_lr', 'sweep_rl', 'orbit_cw', 'orbit_ccw', 'bob', 'sway', 'figure8', 'patrol_vertical', 'pulse', 'flutter']) {
  const first = poseContext.pose(motion, 0.25, 0.35, 0.23, 1);
  const shifted = poseContext.pose(motion, 0.65, 0.75, 0.23, 1);
  assert.ok(Math.abs((shifted.x - first.x) - 0.4) < 1e-9, `${motion} must follow pivot x`);
  assert.ok(Math.abs((shifted.y - first.y) - 0.4) < 1e-9, `${motion} must follow pivot y`);
  const half = poseContext.pose(motion, 0.25, 0.35, 0.23, 0.5);
  const key = motion === 'pulse' ? 'scale' : motion === 'sway' ? 'angle' : motion === 'bob' || motion === 'patrol_vertical' ? 'y' : 'x';
  const origin = key === 'scale' ? 1 : key === 'angle' ? 0 : key === 'x' ? 0.25 : 0.35;
  assert.ok(Math.abs((half[key] - origin) * 2 - (first[key] - origin)) < 1e-9, `${motion} must respond to extent`);
}
console.log('Decoration transform and motion persist; every preset follows the chosen pivot and extent.');
