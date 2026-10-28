import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import './styles.css';

// ORIGINAL CC0 Quaternius model names, verified against source GLTF files.
// These are not placeholders. The original GLTFs embed their own meshes,
// skeletons, material colors, and 24 animations.
const CHARACTER_PACKS = {
  male: {
    title: 'Ultimate Modular Men — February 2022',
    folder: 'Ultimate Modular Men- Feb 2022',
    defaultOutfit: 'Casual_2',
    outfits: ['Casual_2', 'Casual_Hoodie', 'Worker'],
  },
  female: {
    title: 'Ultimate Modular Women — April 2022',
    folder: 'Ultimate Modular Women - April 2022',
    defaultOutfit: 'Casual',
    outfits: ['Casual', 'Worker'],
  },
};

const el = (id) => document.getElementById(id);
const ui = {
  viewport: el('viewport'), overlay: el('status-overlay'), details: el('load-details'),
  global: el('global-status'), indicator: el('model-indicator'),
  maleFact: el('male-fact'), femaleFact: el('female-fact'), outfit: el('outfit'),
  animation: el('animation'), speed: el('speed'), speedValue: el('speed-value'),
  toggleAnimation: el('toggle-anim'), material: el('material'), color: el('material-color'),
  lookName: el('look-name'), savedLooks: el('saved-looks'), uploadStatus: el('upload-status'),
};
const state = { selected: 'male', view: 'both', speed: 1, paused: false, loading: 0 };
const avatars = {
  male: { outfit: CHARACTER_PACKS.male.defaultOutfit, x: -1.25, root: null, mixer: null, clips: [], clip: 'Idle', action: null, materialColors: {} },
  female: { outfit: CHARACTER_PACKS.female.defaultOutfit, x: 1.25, root: null, mixer: null, clips: [], clip: 'Idle', action: null, materialColors: {} },
};
const assetCache = new Map();
const loader = new GLTFLoader();
let savedLooks = [];
try { savedLooks = JSON.parse(localStorage.getItem('collectiverse-quaternius-looks-v6') || '[]'); }
catch { savedLooks = []; }

// 3D engine. Browser WebGL is necessary; StackBlitz provides the Vite server.
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0f1d2c');
scene.fog = new THREE.Fog('#0f1d2c', 13, 27);
const camera = new THREE.PerspectiveCamera(43, 1, .08, 90);
camera.position.set(4.7, 3.3, 7.5);
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.7;
  ui.viewport.appendChild(renderer.domElement);
} catch (err) {
  showFatal('WebGL is not available. Enable hardware acceleration in Chrome.', err);
  throw err;
}
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.target.set(0, 1.18, 0);
controls.minDistance = 2.2;
controls.maxDistance = 17;
controls.maxPolarAngle = Math.PI * 0.53;
controls.update();
scene.add(new THREE.HemisphereLight('#eaf8ff', '#657b92', 2.3));
const keyLight = new THREE.DirectionalLight('#fff1df', 2.8);
keyLight.position.set(-4, 7, 5);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#80c6ff', 2);
rimLight.position.set(4, 5, -5);
scene.add(rimLight);
const platform = new THREE.Mesh(new THREE.CylinderGeometry(3.85, 3.95, .17, 72), new THREE.MeshStandardMaterial({ color: '#254354', roughness: .88 }));
platform.position.y = -.10;
scene.add(platform);
const stageRim = new THREE.Mesh(new THREE.TorusGeometry(3.82, .028, 9, 90), new THREE.MeshBasicMaterial({ color: '#75bbbf' }));
stageRim.rotation.x = Math.PI / 2;
stageRim.position.y = -.005;
scene.add(stageRim);
const floorGrid = new THREE.GridHelper(7.5, 12, '#547d8f', '#345769');
floorGrid.position.y = .001;
scene.add(floorGrid);
const clock = new THREE.Clock();

function resize() {
  const rect = ui.viewport.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(ui.viewport);
resize();
function loop() {
  requestAnimationFrame(loop);
  const delta = Math.min(clock.getDelta(), 0.05);
  for (const avatar of Object.values(avatars)) {
    if (avatar.mixer) avatar.mixer.update(delta);
  }
  controls.update();
  renderer.render(scene, camera);
}
loop();

function showFatal(message, err) {
  ui.overlay.classList.remove('hidden');
  ui.overlay.classList.add('error');
  ui.overlay.querySelector('strong').textContent = message;
  ui.overlay.querySelector('p').textContent = 'No substitute characters will be loaded. You can import genuine downloaded .gltf files using the button in the right panel.';
  ui.overlay.querySelector('.spinner').style.display = 'none';
  ui.details.textContent = err ? String(err.message || err).slice(0, 300) : '';
  ui.global.textContent = 'Model load error';
  document.querySelector('.official').className = 'official error';
}
function updateLoadSummary() {
  const count = Number(Boolean(avatars.male.root)) + Number(Boolean(avatars.female.root));
  if (count > 0) ui.overlay.classList.add('hidden');
  ui.indicator.textContent = `• ${count}/2 real models loaded`;
  ui.global.textContent = count === 2 ? 'Both real models loaded' : count === 1 ? '1 real model loaded' : 'Waiting for original models';
  document.querySelector('.official').className = count ? 'official success' : 'official';
  ui.maleFact.textContent = avatars.male.root ? `Man: ${avatars.male.outfit} • ${avatars.male.clips.length} original animations` : 'Man: not loaded';
  ui.femaleFact.textContent = avatars.female.root ? `Woman: ${avatars.female.outfit} • ${avatars.female.clips.length} original animations` : 'Woman: not loaded';
}
function urlFor(gender, outfit, via = 'raw') {
  const folder = encodeURIComponent(CHARACTER_PACKS[gender].folder);
  const path = `${folder}/Individual%20Characters/glTF/${encodeURIComponent(outfit)}.gltf`;
  return via === 'raw'
    ? `https://raw.githubusercontent.com/agentkaerf/FreeModels/main/${path}`
    : `https://cdn.jsdelivr.net/gh/agentkaerf/FreeModels@main/${path}`;
}
function deadline(p, ms = 22000) {
  let timeout;
  return Promise.race([p, new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Download timed out')), ms); })])
    .finally(() => clearTimeout(timeout));
}
async function obtainModel(gender, outfit) {
  const cacheKey = `${gender}:${outfit}`;
  if (assetCache.has(cacheKey)) return assetCache.get(cacheKey);
  const errors = [];
  // The default genuine Quaternius characters are bundled in /public/models.
  // Other outfit variants download from the verified public CC0 asset mirror.
  const isBundled = (gender === 'male' && outfit === 'Casual_2') || (gender === 'female' && outfit === 'Casual');
  const sources = [];
  if (isBundled) sources.push({ label: 'Bundled model', url: `${import.meta.env.BASE_URL}models/${gender}/${outfit}.gltf` });
  for (const provider of ['raw', 'cdn']) sources.push({ label: provider === 'raw' ? 'GitHub' : 'CDN', url: urlFor(gender, outfit, provider) });
  for (const { label, url } of sources) {
    ui.details.textContent = `Loading ${label} for ${gender} ${outfit}…`;
    try {
      const gltf = await deadline(loader.loadAsync(url));
      if (!gltf.scene || !gltf.animations.length) throw new Error('Source is missing its rig or animations');
      assetCache.set(cacheKey, gltf);
      return gltf;
    } catch (err) {
      errors.push(`${label}: ${err?.message || err}`);
    }
  }
  throw new Error(`Could not download original ${gender} ${outfit} model. ${errors.join(' | ')}`);
}
function clearOld(gender) {
  const a = avatars[gender];
  if (a.mixer && a.root) a.mixer.uncacheRoot(a.root);
  if (a.root) {
    scene.remove(a.root);
    a.root.traverse(node => {
      if (!node.isMesh) return;
      for (const mat of Array.isArray(node.material) ? node.material : [node.material]) mat?.dispose();
    });
  }
  a.root = null; a.mixer = null; a.action = null; a.clips = []; a.materialColors = {};
}
function materialRecord(root) {
  const out = {};
  root.traverse(n => {
    if (!n.isMesh) return;
    for (const mat of Array.isArray(n.material) ? n.material : [n.material]) {
      if (!mat || !mat.color) continue;
      if (!(mat.name in out)) out[mat.name] = `#${mat.color.getHexString()}`;
    }
  });
  return out;
}
function applyMaterialColor(gender, materialName, color) {
  const a = avatars[gender];
  if (!a.root || !materialName) return;
  a.root.traverse(node => {
    if (!node.isMesh) return;
    for (const mat of Array.isArray(node.material) ? node.material : [node.material]) {
      if (mat?.name === materialName && mat.color) mat.color.set(color);
    }
  });
  a.materialColors[materialName] = color;
}
function playClip(gender, name) {
  const a = avatars[gender];
  if (!a.mixer || !a.clips.length) return;
  const clip = a.clips.find(c => c.name === name) || a.clips.find(c => c.name === 'Idle') || a.clips[0];
  if (a.action) a.action.fadeOut(.17);
  a.action = a.mixer.clipAction(clip);
  a.action.reset().fadeIn(.17).play();
  a.clip = clip.name;
  a.mixer.timeScale = state.paused ? 0 : state.speed;
}
async function installModel(gender, gltf, outfit, restoredColors = {}) {
  const avatar = avatars[gender];
  clearOld(gender);
  // SkeletonUtils.clone preserves each skinned mesh's real bone bindings.
  const root = cloneSkeleton(gltf.scene);
  root.traverse(node => {
    if (!node.isMesh) return;
    if (Array.isArray(node.material)) node.material = node.material.map(m => m.clone());
    else if (node.material) node.material = node.material.clone();
    node.frustumCulled = false;
  });
  const bbox = new THREE.Box3().setFromObject(root);
  const size = bbox.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y < 0.01) throw new Error('The original mesh has invalid dimensions');
  const scale = 2.5 / size.y;
  root.scale.setScalar(scale);
  root.position.set(avatar.x, -bbox.min.y * scale, 0);
  // Default original source models face their own native front. Orbit to inspect.
  scene.add(root);
  avatar.outfit = outfit;
  avatar.root = root;
  avatar.clips = gltf.animations;
  avatar.mixer = new THREE.AnimationMixer(root);
  avatar.materialColors = materialRecord(root);
  for (const [name, color] of Object.entries(restoredColors)) applyMaterialColor(gender, name, color);
  playClip(gender, avatar.clip || 'Idle');
  if (state.view === gender || state.view === 'both') root.visible = true;
  else root.visible = false;
  if (state.selected === gender) refreshEditor();
  updateLoadSummary();
  return avatar;
}
async function loadCharacter(gender, outfit, restoredColors) {
  const avatar = avatars[gender];
  state.loading++;
  const token = Symbol('load');
  avatar.loadToken = token;
  const currentlyShowing = Boolean(avatar.root);
  if (!currentlyShowing && !avatars.male.root && !avatars.female.root) ui.overlay.classList.remove('hidden');
  try {
    const gltf = await obtainModel(gender, outfit);
    if (avatar.loadToken !== token) return;
    await installModel(gender, gltf, outfit, restoredColors);
    ui.uploadStatus.textContent = '';
  } catch (err) {
    console.error(err);
    ui.uploadStatus.textContent = err.message;
    if (!avatars.male.root && !avatars.female.root) showFatal('The original character downloads did not load.', err);
    else ui.details.textContent = String(err.message);
    updateLoadSummary();
  } finally {
    state.loading--;
  }
}
function refreshEditor() {
  const gender = state.selected, pack = CHARACTER_PACKS[gender], avatar = avatars[gender];
  el('edit-male').classList.toggle('active', gender === 'male');
  el('edit-female').classList.toggle('active', gender === 'female');
  ui.outfit.replaceChildren(...pack.outfits.map(outfit => new Option(outfit.replace(/_/g, ' '), outfit)));
  ui.outfit.value = avatar.outfit;
  ui.animation.replaceChildren(...avatar.clips.map(c => new Option(c.name.replace(/_/g, ' '), c.name)));
  if (!avatar.clips.length) ui.animation.add(new Option('Waiting for genuine model…', ''));
  ui.animation.value = avatar.clip;
  refreshMaterials();
}
function refreshMaterials() {
  const a = avatars[state.selected];
  const names = Object.keys(a.materialColors);
  const current = names.includes(ui.material.value) ? ui.material.value : names[0];
  ui.material.replaceChildren(...names.map(n => new Option(n, n)));
  if (current) {
    ui.material.value = current;
    ui.color.value = a.materialColors[current];
  } else {
    ui.material.add(new Option('Load a character first', ''));
  }
}
function selectGender(g) { state.selected = g; refreshEditor(); }
el('edit-male').onclick = () => selectGender('male');
el('edit-female').onclick = () => selectGender('female');
ui.outfit.onchange = async () => { await loadCharacter(state.selected, ui.outfit.value); };
ui.animation.onchange = () => playClip(state.selected, ui.animation.value);
function cycleAnimation(step) {
  const a = avatars[state.selected]; if (!a.clips.length) return;
  const i = a.clips.findIndex(c => c.name === a.clip);
  const newIndex = (i + step + a.clips.length) % a.clips.length;
  ui.animation.value = a.clips[newIndex].name;
  playClip(state.selected, a.clips[newIndex].name);
}
el('prev-anim').onclick = () => cycleAnimation(-1);
el('next-anim').onclick = () => cycleAnimation(1);
el('toggle-anim').onclick = () => {
  state.paused = !state.paused;
  ui.toggleAnimation.textContent = state.paused ? 'Play' : 'Pause';
  for (const a of Object.values(avatars)) if (a.mixer) a.mixer.timeScale = state.paused ? 0 : state.speed;
};
ui.speed.oninput = () => {
  state.speed = Number(ui.speed.value);
  ui.speedValue.textContent = `${state.speed.toFixed(1)}×`;
  for (const a of Object.values(avatars)) if (a.mixer && !state.paused) a.mixer.timeScale = state.speed;
};
ui.material.onchange = () => { const color = avatars[state.selected].materialColors[ui.material.value]; if (color) ui.color.value = color; };
el('apply-color').onclick = () => applyMaterialColor(state.selected, ui.material.value, ui.color.value);
ui.color.oninput = () => applyMaterialColor(state.selected, ui.material.value, ui.color.value);
el('reset-colors').onclick = async () => {
  const a = avatars[state.selected];
  if (!a.root) return;
  const outfit = a.outfit;
  await loadCharacter(state.selected, outfit, {});
};
function focusView(mode) {
  state.view = mode;
  avatars.male.root && (avatars.male.root.visible = mode !== 'female');
  avatars.female.root && (avatars.female.root.visible = mode !== 'male');
  if (mode === 'male') selectGender('male');
  if (mode === 'female') selectGender('female');
  const x = mode === 'male' ? avatars.male.x : mode === 'female' ? avatars.female.x : 0;
  controls.target.set(x, 1.17, 0);
  camera.position.set(x + (mode === 'both' ? 4.7 : 3.6), 2.9, mode === 'both' ? 7.5 : 5.3);
  controls.update();
  for (const id of ['both', 'male', 'female']) el(`view-${id}`).classList.toggle('active', mode === id);
}
for (const view of ['both', 'male', 'female']) el(`view-${view}`).onclick = () => focusView(view);
function viewpoint(angle) {
  const target = controls.target.clone();
  const d = camera.position.distanceTo(target);
  camera.position.set(target.x + Math.sin(angle) * d, target.y + Math.max(1, d * .18), target.z + Math.cos(angle) * d);
  controls.update();
}
el('view-front').onclick = () => viewpoint(0);
el('view-side').onclick = () => viewpoint(Math.PI / 2);
el('view-back').onclick = () => viewpoint(Math.PI);
el('view-reset').onclick = () => focusView(state.view);
el('view-zoom-in').onclick = () => { camera.position.lerp(controls.target, .2); controls.update(); };
el('view-zoom-out').onclick = () => { camera.position.sub(controls.target).multiplyScalar(1.25).add(controls.target); controls.update(); };

function storeLooks() { try { localStorage.setItem('collectiverse-quaternius-looks-v6', JSON.stringify(savedLooks)); } catch {} }
function renderSavedLooks() {
  ui.savedLooks.replaceChildren();
  if (!savedLooks.length) {
    const p = document.createElement('p'); p.className = 'small'; p.textContent = 'No looks saved yet.';
    ui.savedLooks.appendChild(p); return;
  }
  savedLooks.forEach((look, i) => {
    const card = document.createElement('div'); card.className = 'saved-item';
    const label = document.createElement('span'); label.textContent = `${look.name} • ${look.gender} • ${look.outfit}`;
    const load = document.createElement('button'); load.textContent = 'Load';
    load.onclick = async () => { selectGender(look.gender); await loadCharacter(look.gender, look.outfit, look.colors); playClip(look.gender, look.clip); refreshEditor(); };
    const remove = document.createElement('button'); remove.textContent = '×'; remove.setAttribute('aria-label','Remove saved look');
    remove.onclick = () => { savedLooks.splice(i, 1); storeLooks(); renderSavedLooks(); };
    card.append(label, load, remove); ui.savedLooks.appendChild(card);
  });
}
el('save-look').onclick = () => {
  const a = avatars[state.selected]; if (!a.root) return;
  const name = ui.lookName.value.trim() || `${state.selected} ${a.outfit} ${savedLooks.length+1}`;
  savedLooks.push({ name, gender: state.selected, outfit: a.outfit, colors: { ...a.materialColors }, clip: a.clip });
  storeLooks(); renderSavedLooks(); ui.lookName.value = '';
};
el('export-looks').onclick = () => {
  const json = JSON.stringify({ project: 'Collectiverse', modelLicense: 'CC0 - Quaternius', looks: savedLooks }, null, 2);
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  link.download = 'collectiverse-character-looks.json'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 500);
};
el('upload-gltf').onchange = async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  ui.uploadStatus.textContent = `Reading genuine local file: ${file.name}…`;
  try {
    const bytes = await file.arrayBuffer();
    const gltf = await new Promise((resolve, reject) => loader.parse(bytes, '', resolve, reject));
    if (!gltf.scene || !gltf.animations.length) throw new Error('File did not contain a skinned animated glTF');
    const g = state.selected;
    await installModel(g, gltf, `LOCAL: ${file.name}`);
    ui.uploadStatus.textContent = `${file.name} imported! ${gltf.animations.length} genuine animation clips available.`;
    // Locally uploaded models are not stored permanently; export saved settings separately.
  } catch (err) {
    ui.uploadStatus.textContent = `Could not import ${file.name}: ${err.message}`;
  }
};

renderSavedLooks();
refreshEditor();
focusView('both');
Promise.allSettled([
  loadCharacter('male', CHARACTER_PACKS.male.defaultOutfit),
  loadCharacter('female', CHARACTER_PACKS.female.defaultOutfit),
]).then(updateLoadSummary);

// Expose read-only debugging data so automated browser tests can verify real models.
window.collectiverseDebug = () => ({
  models: Object.fromEntries(Object.entries(avatars).map(([gender, a]) => [gender, {
    outfit: a.outfit, realMeshCount: a.root ? (() => { let n = 0; a.root.traverse(c => { if (c.isSkinnedMesh) n++; }); return n; })() : 0,
    animationNames: a.clips.map(x => x.name),
    currentClip: a.clip,
  }])),
  savedLooks: savedLooks.length,
});