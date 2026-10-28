// Static/offline project verification; full 3D rendering requires StackBlitz + internet.
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
assert.ok(pkg.dependencies.three, 'Three.js dependency is missing');
assert.ok(pkg.devDependencies.vite, 'Vite dependency is missing');
assert.match(main, /GLTFLoader/);
assert.match(main, /SkeletonUtils/);
assert.match(main, /Casual_2/);
assert.match(main, /Ultimate Modular Men- Feb 2022/);
assert.match(main, /Ultimate Modular Women - April 2022/);
assert.match(main, /gltf\.animations/);
assert.match(main, /isSkinnedMesh/);
assert.match(main, /new THREE\.AnimationMixer/);
assert.match(main, /loader\.parse/);
assert.match(main, /No substitute characters/);
assert.match(html, /src\/main\.js/);
const requiredIds = [...main.matchAll(/\bel\('([^']+)'\)/g)].map(m => m[1]);
for (const id of requiredIds) assert.match(html, new RegExp(`id="${id}"`), `Missing control ${id}`);
assert.ok(existsSync(new URL('../src/styles.css', import.meta.url)));
console.log(`PASS: ${requiredIds.length} JS control references exist in HTML.`);
console.log('PASS: genuine model filenames, original animation mixer, local .gltf import, Three.js and Vite configured.');
for (const [gender, outfit] of [['male','Casual_2'],['female','Casual']]) {
  const file = new URL(`../public/models/${gender}/${outfit}.gltf`, import.meta.url);
  assert.ok(existsSync(file), `Missing genuine bundled model ${gender}/${outfit}`);
  const gltf = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(gltf.animations.length, 24, `Wrong original animations for ${gender}`);
  assert.ok(gltf.skins.length === 1 && gltf.buffers[0].uri.startsWith('data:'), 'Unusable character glTF');
}
console.log('PASS: original male and female glTF assets bundled, both with 24 animation clips.');
console.log('NOT RUN: actual browser 3D render (requires Chrome / StackBlitz).');