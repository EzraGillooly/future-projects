import * as THREE from "three";

// Procedurally drawn canvas textures — no external image files. Everything is
// generated once at load. A tiny seeded RNG keeps the look stable across reloads
// (window layouts don't flicker each refresh).

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WARM = ["#ffd79a", "#ffc477", "#ffe0b0", "#ffb35c"];
const COOL = ["#9fd8ff", "#bfe6ff", "#7cc4ff"];

// A tileable building facade: dark wall with a grid of windows, some lit
// (warm/cool), some dark. Used as both map and emissiveMap so only windows glow.
export function makeFacadeTexture(seed = 1): THREE.CanvasTexture {
  const size = 512;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = size;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  // Wall base
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "#191d2c");
  g.addColorStop(1, "#0e111b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const cols = 8;
  const rows = 8;
  const cell = size / cols;
  const winW = cell * 0.52;
  const winH = cell * 0.62;
  const offX = (cell - winW) / 2;
  const offY = (cell - winH) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cell + offX;
      const y = r * cell + offY;
      const lit = rng() > 0.35;
      if (!lit) {
        ctx.fillStyle = "#0a0c14";
        ctx.fillRect(x, y, winW, winH);
        continue;
      }
      const warm = rng() > 0.45;
      const pal = warm ? WARM : COOL;
      const col = pal[Math.floor(rng() * pal.length)];
      // glow halo
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x, y, winW, winH);
      // brighter core
      ctx.globalAlpha = 1;
      ctx.fillStyle = warm ? "#fff1d4" : "#e8f6ff";
      ctx.fillRect(x + winW * 0.2, y + winH * 0.15, winW * 0.6, winH * 0.5);
      // a horizontal blind line for texture
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#00000055";
      ctx.fillRect(x, y + winH * 0.55, winW, winH * 0.12);
      ctx.globalAlpha = 1;
    }
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A lit convenience-store / shop front: glass panels with a warm interior glow,
// stacked shelves and coloured product blobs, and a couple of posters. Used as
// map + emissiveMap on the shop's front panels.
export function makeStorefrontTexture(seed = 7): THREE.CanvasTexture {
  const w = 512;
  const h = 384;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  // Warm lit interior behind the glass
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#3a3320");
  bg.addColorStop(1, "#6a5a30");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Mullions: split into glass bays
  const bays = 4;
  const bw = w / bays;
  for (let b = 0; b < bays; b++) {
    const x0 = b * bw;
    // shelves with product blobs
    for (let s = 0; s < 5; s++) {
      const sy = 60 + s * 58;
      ctx.fillStyle = "#2a2416";
      ctx.fillRect(x0 + 8, sy + 34, bw - 16, 6);
      for (let p = 0; p < 6; p++) {
        const cols = ["#d94f4f", "#4fd98a", "#4f8fd9", "#e0c24f", "#d97fce", "#e07f3f"];
        ctx.fillStyle = cols[Math.floor(rng() * cols.length)];
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x0 + 10 + p * (bw / 6.5), sy + 14, bw / 8, 20);
      }
      ctx.globalAlpha = 1;
    }
    // bright top valance
    ctx.fillStyle = "#fff6d8";
    ctx.fillRect(x0 + 4, 8, bw - 8, 16);
    // mullion frame
    ctx.strokeStyle = "#0a0c10";
    ctx.lineWidth = 6;
    ctx.strokeRect(x0 + 2, 2, bw - 4, h - 4);
  }
  // a couple of posters on the glass
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ["#ff5252", "#42c7ff", "#ffd23f"][i];
    ctx.globalAlpha = 0.9;
    const px = 20 + rng() * (w - 90);
    ctx.fillRect(px, 30 + rng() * 200, 44, 60);
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A vertical neon signboard with stacked characters (as in the refs). Bright on
// dark so it glows through bloom when used on an unlit (basic) material.
export function makeSignTexture(chars: string, accent = "#ff4fd8"): THREE.CanvasTexture {
  const w = 128;
  const h = 384;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;

  ctx.fillStyle = "#0a0b12";
  ctx.fillRect(0, 0, w, h);
  // glowing border
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  // stacked glyphs
  const glyphs = [...chars];
  const step = (h - 40) / glyphs.length;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 58px 'Hiragino Sans', 'Yu Gothic', sans-serif";
  ctx.fillStyle = "#fff";
  ctx.shadowColor = accent;
  ctx.shadowBlur = 22;
  glyphs.forEach((g, i) => {
    ctx.fillText(g, w / 2, 30 + step * (i + 0.5));
  });

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A horizontal shop banner: a wordmark on a light board, optional coloured
// stripes. Used over shop doors ("24H MART", "GARAGE", ...).
export function makeBannerTexture(
  word = "24H MART",
  wordColor = "#1c8a3c",
  stripes = true,
  board = "#f4f6ff",
): THREE.CanvasTexture {
  const w = 512;
  const h = 96;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;

  ctx.fillStyle = board;
  ctx.fillRect(0, 0, w, h);
  if (stripes) {
    ctx.fillStyle = "#ef4136";
    ctx.fillRect(0, h - 22, w, 8);
    ctx.fillStyle = "#f7931e";
    ctx.fillRect(0, h - 14, w, 8);
    ctx.fillStyle = "#2ba24c";
    ctx.fillRect(0, h - 6, w, 6);
  }
  ctx.fillStyle = wordColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 46px system-ui, sans-serif";
  ctx.fillText(word, w / 2, h / 2 - (stripes ? 6 : 0));

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Battered wet asphalt: dark base with cracks, patches, oil stains and faded
// paint smudges. Used as the road's map (on the reflective material).
export function makeRoadTexture(seed = 5): THREE.CanvasTexture {
  const s = 512;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = s;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  ctx.fillStyle = "#14161d";
  ctx.fillRect(0, 0, s, s);
  // tonal patches (repaved sections)
  for (let i = 0; i < 26; i++) {
    const shade = 18 + Math.floor(rng() * 22);
    ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 6})`;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(rng() * s, rng() * s, 40 + rng() * 120, 30 + rng() * 90);
  }
  ctx.globalAlpha = 1;
  // speckle grain
  for (let i = 0; i < 2600; i++) {
    const v = rng();
    ctx.fillStyle = v > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.25)";
    ctx.fillRect(rng() * s, rng() * s, 1, 1);
  }
  // cracks
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  for (let i = 0; i < 22; i++) {
    ctx.lineWidth = rng() > 0.7 ? 2 : 1;
    ctx.beginPath();
    let x = rng() * s;
    let y = rng() * s;
    ctx.moveTo(x, y);
    const segs = 3 + Math.floor(rng() * 5);
    for (let j = 0; j < segs; j++) {
      x += (rng() - 0.5) * 90;
      y += (rng() - 0.5) * 90;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // oil stains
  for (let i = 0; i < 8; i++) {
    const g = ctx.createRadialGradient(
      rng() * s,
      rng() * s,
      2,
      rng() * s,
      rng() * s,
      20 + rng() * 40,
    );
    g.addColorStop(0, "rgba(0,0,0,0.4)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  }
  // faded paint smudges
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "rgba(200,190,140,0.12)";
    ctx.fillRect(rng() * s, rng() * s, 8 + rng() * 30, 4);
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Soft-edged blob (radial alpha) for puddle shapes so they melt into the road.
export function makePuddleAlpha(): THREE.CanvasTexture {
  const s = 128;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = s;
  const ctx = cvs.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.6, "#ffffff");
  g.addColorStop(1, "#000000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cvs);
  return tex;
}

// Corrugated metal siding (vertical ribs) for the garage front.
export function makeCorrugatedTexture(): THREE.CanvasTexture {
  const s = 256;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = s;
  const ctx = cvs.getContext("2d")!;
  ctx.fillStyle = "#2a2f3d";
  ctx.fillRect(0, 0, s, s);
  const ribs = 16;
  const rw = s / ribs;
  for (let i = 0; i < ribs; i++) {
    const x = i * rw;
    const g = ctx.createLinearGradient(x, 0, x + rw, 0);
    g.addColorStop(0, "#1c202b");
    g.addColorStop(0.5, "#394154");
    g.addColorStop(1, "#1c202b");
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, rw, s);
  }
  // faint horizontal seams
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (let y = 0; y < s; y += 64) ctx.fillRect(0, y, s, 2);

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A wide night-city backdrop: gradient sky, stars, and layered building
// silhouettes speckled with tiny lit windows. Rendered unlit (self-emissive).
export function makeSkylineTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 640;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(99);

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#0a0a1f");
  sky.addColorStop(0.55, "#1a1636");
  sky.addColorStop(1, "#3a2247");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars
  for (let i = 0; i < 400; i++) {
    const x = rng() * w;
    const y = rng() * h * 0.55;
    const a = rng() * 0.8 + 0.2;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, rng() > 0.9 ? 2 : 1, 1);
  }

  // Building layers, far (dark) to near (lighter), each with lit windows.
  const layers = [
    { base: h * 0.62, col: "#0e1024", maxH: 120, count: 40, winA: 0.5 },
    { base: h * 0.72, col: "#14162e", maxH: 180, count: 34, winA: 0.7 },
    { base: h * 0.82, col: "#1a1d38", maxH: 240, count: 26, winA: 0.9 },
  ];
  for (const L of layers) {
    let x = 0;
    while (x < w) {
      const bw = 30 + rng() * 70;
      const bh = 40 + rng() * L.maxH;
      const top = L.base - bh;
      ctx.fillStyle = L.col;
      ctx.fillRect(x, top, bw, h - top);
      // windows
      const wc = Math.max(1, Math.floor(bw / 12));
      const wr = Math.max(1, Math.floor(bh / 14));
      for (let r = 0; r < wr; r++) {
        for (let c = 0; c < wc; c++) {
          if (rng() > 0.5) continue;
          const warm = rng() > 0.4;
          ctx.fillStyle = warm
            ? `rgba(255,200,120,${L.winA})`
            : `rgba(150,200,255,${L.winA})`;
          ctx.fillRect(x + 5 + c * 12, top + 6 + r * 14, 5, 7);
        }
      }
      x += bw + 3 + rng() * 8;
    }
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
