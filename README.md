# Collectiverse — Real Quaternius Character Lab (StackBlitz)

This is a **separate character preview**, not the Collectiverse Tycoon game. The preview uses original low-poly skinned Quaternius characters from **Ultimate Modular Men** and **Ultimate Modular Women**. Each pack contains 24 original clips including `Idle`, `Walk`, `Run`, `Wave`, and `Interact`. No stand-in figures or fake animation clips are used.

## One-click StackBlitz (GitHub branch)

Open the playable editor at:

**https://stackblitz.com/fork/github/RedBeard-Creative/ThatchersGame/tree/collectiverse-character-lab?startScript=dev**

This is a standalone preview kept on a separate `collectiverse-character-lab` branch. **The GitHub repository is private: direct private-repo import into StackBlitz may require a paid StackBlitz membership.** If StackBlitz says repository not found, use the manual ZIP import rather than changing the existing Wildbound repository's privacy. It **does not modify Wildbound on the main branch**. Click the preview's **Open in New Tab** button if the 3D scene looks small. The first load may take a moment while StackBlitz installs Three.js and downloads the original Quaternius model files.

## Optional manual import (Chromebook)

1. Download the ZIP provided in ChatGPT, then extract it in your Chromebook's Files app.
2. Visit **https://stackblitz.com/fork/vite** (or use the Vite starter at StackBlitz).
3. In the left **Files** panel, drag the **contents** of the extracted project folder into the starter project. Confirm replacement of `index.html`, `package.json`, and the `src` folder. Avoid dragging the containing folder so that `package.json` remains at the root.
4. StackBlitz normally installs packages and starts the preview automatically. If it does not, open Terminal and run `npm install` and then `npm run dev`.
5. Click **Open in New Tab** on the preview for a full-size view.

## Controls

- Drag to rotate; mouse-wheel to zoom; right-drag to pan.
- Choose Man, Woman, or Both; front, side, back and zoom controls.
- Choose any of the 11 real male or 10 real female character variants.
- Choose among **24 original animations** (depends on the loaded file).
- Adjust original material colors and save named variants in local storage.
- Export named variants to JSON for future Collectiverse development.

## Original models and connection requirements

The two default original `.gltf` files are now included at `public/models/male/Casual_2.gltf` and `public/models/female/Casual.gltf`. Other outfit options download original `.gltf` models from this public source mirror on demand:
https://github.com/agentkaerf/FreeModels

- Male starting file: `Ultimate Modular Men- Feb 2022/Individual Characters/glTF/Casual_2.gltf`
- Female starting file: `Ultimate Modular Women - April 2022/Individual Characters/glTF/Casual.gltf`

The files contain their own mesh, skeleton, color materials and encoded geometry. Internet is needed to load the original models, even when StackBlitz itself is running. **If GitHub/CDN access fails, the program shows an error rather than generating a fake model.** You can also download the genuine `.gltf` directly from the mirror and use the **Import original .gltf** selector in the editor. The local file is imported into the browser only.

## Licensing

The underlying original assets are by **Quaternius**, released under **CC0**. Read the license shipped with the source archive before redistribution. The project code is original to this Collectiverse preview.

- https://quaternius.com/packs/ultimatemodularcharacters.html
- https://quaternius.com/packs/ultimatemodularwomen.html
- https://creativecommons.org/publicdomain/zero/1.0/

## Verification note

The project files were locally syntax-checked. The two real files were independently inspected: both expose 24 embedded original animation clips and a skinned model. **Full StackBlitz rendering needs to be tested in your browser** because the build environment used to package the project cannot reach the GitHub asset mirror or npm registry.