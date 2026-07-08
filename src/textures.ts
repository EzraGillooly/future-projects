import * as THREE from "three";

// Procedurally drawn canvas textures — no external image files. Everything is
// generated once at load. A tiny seeded RNG keeps the look stable across reloads
// (window layouts don't flicker each refresh).

export function mulberry32(seed: number) {
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
const NEON = ["#ff3bd0", "#3bd7ff", "#ffb43f", "#8b5bff", "#ff5d5d", "#3bffa0"];

// A cyberpunk tower facade meant to be mapped ONCE per building face (repeat
// 1,1) — no tiled window lattice. Irregular vertical bays of ribbon glazing,
// floors that are lit / dim / dark at random, whole dark structural bays,
// horizontal signage bands and vertical neon strips. Heavily seed-varied so no
// two buildings read alike. Bright pixels double as the emissiveMap so only the
// windows/neon glow; keep the material emissive white so these colours show.
export function makeFacadeTexture(seed = 1): THREE.CanvasTexture {
  const w = 512;
  const h = 768;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  // base wall — a few dark tints
  const tints: [string, string][] = [
    ["#12151f", "#090b12"],
    ["#161320", "#0b0912"],
    ["#101a1e", "#070f12"],
    ["#1a1520", "#0c0a12"],
  ];
  const [t0, t1] = tints[Math.floor(rng() * tints.length)];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, t0);
  g.addColorStop(1, t1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const accent = NEON[Math.floor(rng() * NEON.length)];
  const litChance = 0.32 + rng() * 0.4; // how alive the tower is
  const floorH = 20 + rng() * 16;

  // irregular vertical bays
  const bays: { x: number; bw: number; dark: boolean }[] = [];
  let x = 0;
  while (x < w) {
    const bw = w * (0.07 + rng() * 0.13);
    bays.push({ x, bw, dark: rng() < 0.18 });
    x += bw;
  }

  for (const bay of bays) {
    const wx = bay.x + 2;
    const ww = Math.max(4, bay.bw - 4);
    for (let y = h - floorH; y > 0; y -= floorH) {
      if (bay.dark || rng() > litChance) {
        ctx.fillStyle = "#05070d";
        ctx.fillRect(wx, y + 1, ww, floorH - 2);
        continue;
      }
      const warm = rng() > 0.5;
      const pal = warm ? WARM : COOL;
      const col = pal[Math.floor(rng() * pal.length)];
      // ribbon glazing: a lit horizontal band
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = col;
      ctx.fillRect(wx, y + floorH * 0.2, ww, floorH * 0.55);
      // brighter core
      ctx.globalAlpha = 1;
      ctx.fillStyle = warm ? "#fff3d8" : "#eafaff";
      ctx.fillRect(wx, y + floorH * 0.32, ww, floorH * 0.28);
      // vertical mullions splitting the ribbon into windows
      ctx.fillStyle = t1;
      for (let mx = wx + 6; mx < wx + ww; mx += 8 + rng() * 6) {
        ctx.fillRect(mx, y + floorH * 0.2, 1.5, floorH * 0.55);
      }
    }
    // occasional vertical neon strip up a bay edge
    if (rng() < 0.22) {
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      ctx.fillStyle = accent;
      ctx.fillRect(bay.x + (rng() < 0.5 ? 0 : bay.bw - 3), h * (0.1 + rng() * 0.3), 3, h * (0.3 + rng() * 0.4));
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;

  // horizontal signage / setback bands glowing across the whole facade
  const bands = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < bands; i++) {
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 16;
    ctx.fillStyle = accent;
    ctx.fillRect(0, h * (0.15 + rng() * 0.7), w, 3 + rng() * 3);
    ctx.restore();
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

// Worn Japanese-street asphalt: bluish-grey base, fine aggregate, tar-filled
// crack seams, patch repairs with outlines, oil stains, faded paint ghosts.
// Used as the road's map on the (barely) reflective material.
export function makeRoadTexture(seed = 5): THREE.CanvasTexture {
  const s = 512;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = s;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  // Bluish-grey base with a faint gradient (mid-dark so detail reads at night)
  const base = ctx.createLinearGradient(0, 0, s, s);
  base.addColorStop(0, "#2b3038");
  base.addColorStop(1, "#23272f");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, s, s);

  // repaved patches with a tar seam outline
  for (let i = 0; i < 9; i++) {
    const x = rng() * s;
    const y = rng() * s;
    const w = 60 + rng() * 150;
    const h = 45 + rng() * 120;
    const sh = 22 + Math.floor(rng() * 14);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = `rgb(${sh},${sh + 3},${sh + 9})`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);
    ctx.globalAlpha = 1;
  }

  // fine aggregate speckle
  for (let i = 0; i < 6500; i++) {
    const v = rng();
    ctx.fillStyle = v > 0.55 ? "rgba(175,188,205,0.06)" : "rgba(0,0,0,0.22)";
    ctx.fillRect(rng() * s, rng() * s, 1, 1);
  }

  // tar-filled cracks: black snaking lines with a faint sheen edge
  for (let i = 0; i < 28; i++) {
    let x = rng() * s;
    let y = rng() * s;
    const segs = 4 + Math.floor(rng() * 6);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < segs; j++) {
      x += (rng() - 0.5) * 80;
      y += (rng() - 0.5) * 80;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = rng() > 0.6 ? 3 : 1.5;
    ctx.stroke();
    ctx.strokeStyle = "rgba(95,105,120,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // oil stains
  for (let i = 0; i < 7; i++) {
    const cx = rng() * s;
    const cy = rng() * s;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22 + rng() * 44);
    g.addColorStop(0, "rgba(0,0,0,0.42)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  }

  // faded paint ghosts
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "rgba(200,205,205,0.08)";
    ctx.fillRect(rng() * s, rng() * s, 8 + rng() * 34, 4);
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Concrete sidewalk as ONE long non-repeating strip mapped across the whole
// walk (repeat 1,1) so no two panels look alike. A single lengthwise joint runs
// the length; evenly-spaced vertical grooves split it into panels (one row);
// cracks and stains are scattered erratically along the entire length so the
// repetition that a tiled texture would show is gone. `panels` sets how many
// vertical divisions appear across the full 60m walk.
export function makeSidewalkTexture(seed = 3, panels = 22): THREE.CanvasTexture {
  const w = 4096;
  const h = 128;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  // mottled concrete base
  ctx.fillStyle = "#484b53";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 28000; i++) {
    ctx.fillStyle = rng() > 0.5 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
    ctx.fillRect(rng() * w, rng() * h, 2, 2);
  }
  // stains scattered along the whole length (varied size/darkness)
  for (let i = 0; i < 60; i++) {
    const cx = rng() * w;
    const cy = rng() * h;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18 + rng() * 55);
    g.addColorStop(0, `rgba(0,0,0,${0.08 + rng() * 0.12})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // vertical panel dividers, spaced across the length (crisp, straight lines;
  // the road-edge lengthwise line is drawn separately as a mesh per sidewalk)
  const step = w / panels;
  const divX: number[] = [];
  for (let p = 1; p < panels; p++) {
    const x = Math.round(p * step + (rng() - 0.5) * 8);
    divX.push(x);
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    // thin bevel highlight beside the groove
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, 0);
    ctx.lineTo(x + 2, h);
    ctx.stroke();
  }

  // rounded, tooled corners: a small quarter-arc centred on each corner (where a
  // divider meets an edge) so the panel corners read soft rather than square.
  const r = 8;
  ctx.lineWidth = 1.5;
  for (const x of divX) {
    // [edge-y, arc quadrant per side] — top edge quadrants face down, bottom up
    for (const [ey, downRight, downLeft] of [
      [0, [0, Math.PI / 2], [Math.PI / 2, Math.PI]],
      [h, [-Math.PI / 2, 0], [Math.PI, 1.5 * Math.PI]],
    ] as const) {
      for (const [a0, a1] of [downRight, downLeft]) {
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.arc(x, ey, r, a0, a1);
        ctx.stroke();
      }
    }
  }

  // cracks scattered erratically — random panel corners along the whole strip,
  // varied length/branch/angle so they never land in the same spot twice.
  const corners = [0, ...divX, w];
  for (const cx of corners) {
    const nCracks = Math.floor(rng() * 2.6); // 0–2 per divider
    for (let c = 0; c < nCracks; c++) {
      const fromTop = rng() > 0.5;
      let x = cx + (rng() - 0.5) * 10;
      let y = fromTop ? 2 : h - 2;
      const dir = rng() > 0.5 ? 1 : -1;
      ctx.strokeStyle = `rgba(0,0,0,${0.35 + rng() * 0.3})`;
      ctx.lineWidth = 1 + rng() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segs = 2 + Math.floor(rng() * 3);
      for (let j = 0; j < segs; j++) {
        x += dir * (10 + rng() * 26);
        y += (fromTop ? 1 : -1) * (10 + rng() * 22);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// A worn painted road line as an alpha strip, mapped along a continuous plane.
// The paint fades SPORADICALLY along its length — thinning to a floor (never
// vanishing) in worn stretches and reading near-fresh in others, with soft
// transitions (natural tear, not chopped-out chunks). `dashed` draws Japanese
// centre-line dashes (each dash independently worn); otherwise a solid edge
// line. White on transparent → use as alphaMap on a white material.
export function makeLineTexture(seed = 11, dashed = false): THREE.CanvasTexture {
  const w = 2048;
  const h = 32;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  ctx.clearRect(0, 0, w, h);

  // sporadic wear profile: a smooth-ish random walk in [floor, 1] sampled along
  // the length, so alpha eases between faded and fresh without ever hitting 0.
  const floor = 0.36;
  const n = 96;
  const prof: number[] = [];
  let v = 0.9;
  for (let i = 0; i < n; i++) {
    v += (rng() - 0.5) * 0.5;
    v = Math.max(floor, Math.min(1, v));
    // occasional worn patch, sometimes a longer faded stretch
    if (rng() < 0.12) v = floor + rng() * 0.18;
    prof.push(v);
  }
  // stretch some worn dips across several samples so the fade reads at a glance
  for (let i = 1; i < n - 1; i++) {
    if (prof[i] < floor + 0.2 && rng() < 0.5) {
      prof[i + 1] = Math.min(prof[i + 1], prof[i] + 0.05);
    }
  }
  const alphaAt = (x: number) => {
    const t = (x / w) * (n - 1);
    const i = Math.floor(t);
    const f = t - i;
    const a = prof[i];
    const b = prof[Math.min(n - 1, i + 1)];
    return a + (b - a) * f;
  };

  // Wear is baked as BRIGHTNESS (grey), full opacity — three's alphaMap samples
  // the green channel, so encoding it in brightness (not canvas alpha) is what
  // actually makes the paint fade. Gaps stay black (0 → transparent).
  const drawSpan = (x0: number, x1: number) => {
    const cy = h / 2;
    const half = h * 0.34;
    for (let x = x0; x < x1; x++) {
      const a = alphaAt(x) * (0.85 + rng() * 0.15);
      const g = Math.round(Math.max(0, Math.min(1, a)) * 255);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(x, cy - half, 1, half * 2);
    }
  };

  if (dashed) {
    // dashes on a period that divides the canvas evenly, so the wrap seam never
    // produces an odd long/short dash. Each dash still worn per the profile.
    const period = 256;
    const dashLen = 150;
    for (let x = 0; x < w; x += period) {
      drawSpan(x, Math.min(w, x + dashLen));
    }
  } else {
    drawSpan(0, w);
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Soft-edged blob (radial alpha) for puddle shapes so they melt into the road.
// Alpha mask for a puddle: an irregular, off-centre blob with soft edges (so
// puddles read as real spills, not perfect ovals). Each seed → a unique shape.
export function makePuddleAlpha(seed = 1): THREE.CanvasTexture {
  const s = 128;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = s;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, s, s);

  // random radius per angle, neighbour-averaged for organic (not spiky) edges
  const steps = 22;
  const radii: number[] = [];
  for (let i = 0; i < steps; i++) radii.push(0.5 + rng() * 0.5);
  const cx = s / 2 + (rng() - 0.5) * 16;
  const cy = s / 2 + (rng() - 0.5) * 16;

  ctx.filter = "blur(6px)";
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = ((radii[i % steps] + radii[(i + 1) % steps]) / 2) * s * 0.4;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.85;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.filter = "none";

  const tex = new THREE.CanvasTexture(cvs);
  return tex;
}

// Corrugated metal siding (vertical ribs) for the garage front.
// A vertical rust streak with a soft alpha, drawn on transparent. Used as decal
// planes on the corrugated walls (non-repeating) so weathering doesn't tile.
export function makeRustStreakTexture(seed = 1): THREE.CanvasTexture {
  const w = 64;
  const h = 256;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);
  ctx.clearRect(0, 0, w, h);
  const streaks = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < streaks; i++) {
    const x = 8 + rng() * (w - 16);
    const y0 = rng() * h * 0.3;
    const len = h * (0.4 + rng() * 0.5);
    const ww = 3 + rng() * 7;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + len);
    g.addColorStop(0, "rgba(122,62,32,0)");
    g.addColorStop(0.18, `rgba(118,58,30,${0.5 + rng() * 0.35})`);
    g.addColorStop(0.7, "rgba(92,48,28,0.4)");
    g.addColorStop(1, "rgba(70,38,24,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y0, ww, len);
    // a rusty origin blotch at the top of the streak
    const br = 4 + rng() * 6;
    const rg = ctx.createRadialGradient(x + ww / 2, y0, 1, x + ww / 2, y0, br);
    rg.addColorStop(0, "rgba(130,66,34,0.6)");
    rg.addColorStop(1, "rgba(130,66,34,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x + ww / 2 - br, y0 - br, br * 2, br * 2);
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A hand-painted shop logo/name on transparent, for a matte decal on the wall
// (used as map on a non-emissive plane so it reads as paint, not neon).
export function makePaintedLogo(text: string, color = "#e6e9f2"): THREE.CanvasTexture {
  const w = 512;
  const h = 220;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 150px 'Hiragino Sans', 'Yu Gothic', Arial, sans-serif";
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, h / 2 + 6);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A cluster of small sponsor/brand stickers on transparent, for a decal plane
// near the door. Generic performance labels (no real trademarks).
export function makeSponsorDecals(seed = 1): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);
  ctx.clearRect(0, 0, w, h);
  const stickers = [
    { c: "#d23b3b", t: "TURBO" },
    { c: "#f0f0f0", t: "RACING" },
    { c: "#2f6fd0", t: "4A-GE" },
    { c: "#e6b93b", t: "改" },
    { c: "#38a05a", t: "DRIFT" },
    { c: "#e0e0e0", t: "RB26" },
  ];
  let x = 40;
  let y = 60;
  for (const s of stickers) {
    const sw = 90 + rng() * 60;
    const sh = 40 + rng() * 20;
    const rot = (rng() - 0.5) * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = s.c;
    ctx.beginPath();
    ctx.roundRect(-sw / 2, -sh / 2, sw, sh, 6);
    ctx.fill();
    ctx.fillStyle = s.c === "#f0f0f0" || s.c === "#e0e0e0" || s.c === "#e6b93b" ? "#111" : "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 26px Arial, 'Hiragino Sans', sans-serif";
    ctx.fillText(s.t, 0, 2);
    ctx.restore();
    x += sw + 18;
    if (x > w - 80) {
      x = 40 + rng() * 40;
      y += 90;
    }
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A warm, dimly-lit garage interior glimpse for behind the shop windows: a back
// wall, a pegboard with hanging tools, a workbench, and a warm light glow. Used
// as map + emissiveMap on a backing panel so the window reads as a lit interior.
export function makeShopInteriorTexture(seed = 1): THREE.CanvasTexture {
  const w = 256;
  const h = 192;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  // warm back wall
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#5a4127");
  g.addColorStop(1, "#2a2016");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // warm ceiling light glow near the top
  const gl = ctx.createRadialGradient(w * 0.5, 0, 4, w * 0.5, 0, w * 0.6);
  gl.addColorStop(0, "rgba(255,220,150,0.75)");
  gl.addColorStop(1, "rgba(255,220,150,0)");
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, w, h);

  // pegboard panel with hanging tools (dark silhouettes)
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(w * 0.08, h * 0.12, w * 0.5, h * 0.42);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  for (let i = 0; i < 10; i++) {
    const x = w * 0.1 + rng() * w * 0.46;
    const y = h * 0.16 + rng() * h * 0.3;
    const tw = 3 + rng() * 5;
    const th = 8 + rng() * 20;
    ctx.fillRect(x, y, tw, th);
  }

  // shelves on the right with parts/boxes
  for (let s = 0; s < 3; s++) {
    const sy = h * (0.18 + s * 0.16);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(w * 0.62, sy, w * 0.3, 3);
    for (let b = 0; b < 3; b++) {
      ctx.fillStyle = rng() > 0.5 ? "rgba(120,90,55,0.6)" : "rgba(60,55,50,0.6)";
      ctx.fillRect(w * 0.63 + b * w * 0.1, sy - 12, w * 0.08, 12);
    }
  }

  // workbench along the bottom
  ctx.fillStyle = "#1b140d";
  ctx.fillRect(0, h * 0.74, w, h * 0.26);
  ctx.fillStyle = "rgba(255,210,140,0.15)";
  ctx.fillRect(0, h * 0.74, w, 3);

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A shelf of manga spines — colourful vertical spines with title bars.
export function makeMangaSpines(seed = 1): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);
  ctx.fillStyle = "#0c0d12";
  ctx.fillRect(0, 0, w, h);
  const cols = ["#d94a4a", "#e6a93b", "#3ba0d9", "#5ac46a", "#b06bff", "#e0e0e0", "#e05aa0", "#2f6fd0"];
  let x = 3;
  while (x < w - 3) {
    const sw = 7 + rng() * 12;
    const c = cols[Math.floor(rng() * cols.length)];
    ctx.fillStyle = c;
    ctx.fillRect(x, 4, sw, h - 8);
    // title band
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(x, 12 + rng() * (h - 40), sw, 5 + rng() * 6);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(x + 1, 6 + rng() * 6, sw - 2, 2);
    x += sw + 1.5;
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// An abstract JDM poster: dark ground, a car silhouette, an accent stripe, text
// blocks. Generic (no real logos). Used on wall poster planes.
export function makePosterTexture(seed = 1): THREE.CanvasTexture {
  const w = 256;
  const h = 384;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);
  const accents = ["#ff3bd0", "#3bd7ff", "#ff8a3b", "#e6b93b", "#5ac46a"];
  const accent = accents[Math.floor(rng() * accents.length)];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#10131c");
  g.addColorStop(1, "#05070c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // accent diagonal stripe
  ctx.save();
  ctx.translate(w / 2, h * 0.55);
  ctx.rotate(-0.35);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(-w, -10, w * 2, 14);
  ctx.restore();
  ctx.globalAlpha = 1;
  // low-poly car silhouette
  ctx.fillStyle = "#1a1e2a";
  ctx.beginPath();
  ctx.moveTo(30, h * 0.62);
  ctx.lineTo(70, h * 0.5);
  ctx.lineTo(130, h * 0.46);
  ctx.lineTo(200, h * 0.5);
  ctx.lineTo(230, h * 0.62);
  ctx.lineTo(210, h * 0.68);
  ctx.lineTo(50, h * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0a0c12";
  ctx.beginPath();
  ctx.arc(80, h * 0.68, 16, 0, Math.PI * 2);
  ctx.arc(185, h * 0.68, 16, 0, Math.PI * 2);
  ctx.fill();
  // headlight glow
  ctx.fillStyle = accent;
  ctx.fillRect(224, h * 0.55, 8, 6);
  // text blocks
  ctx.fillStyle = "#e8ecf5";
  ctx.font = "bold 34px Arial, sans-serif";
  ctx.fillText(["TOUGE", "DRIFT", "臨界", "WANGAN", "MAX"][Math.floor(rng() * 5)], 20, h * 0.16);
  ctx.fillStyle = accent;
  ctx.fillRect(20, h * 0.18, 120, 4);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A replaceable-art placeholder: a soft gradient with a dashed border and a
// "REPLACE" label, so Ezra knows to swap it for a real image later.
export function makeArtPlaceholder(seed = 1): THREE.CanvasTexture {
  const s = 256;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = s;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);
  const hue = Math.floor(rng() * 360);
  const g = ctx.createLinearGradient(0, 0, s, s);
  g.addColorStop(0, `hsl(${hue}, 40%, 30%)`);
  g.addColorStop(1, `hsl(${(hue + 60) % 360}, 45%, 18%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 8]);
  ctx.strokeRect(14, 14, s - 28, s - 28);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.font = "bold 26px Arial, sans-serif";
  ctx.fillText("YOUR ART", s / 2, s / 2 - 6);
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("(replace me)", s / 2, s / 2 + 22);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A square album/record cover (abstract).
export function makeAlbumArt(seed = 1): THREE.CanvasTexture {
  const s = 128;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = s;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);
  const hue = Math.floor(rng() * 360);
  ctx.fillStyle = `hsl(${hue}, 55%, 22%)`;
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = `hsl(${(hue + 40) % 360}, 70%, 55%)`;
  const shape = rng();
  if (shape < 0.5) {
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(s * 0.2, s * 0.2, s * 0.6, s * 0.6);
  }
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(10, s - 24, s * 0.5, 5);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

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

  // Low city-glow haze band near the horizon (light pollution), tinted so the
  // real geometry buildings in front sit against a warm/magenta night sky.
  const glow = ctx.createLinearGradient(0, h * 0.55, 0, h);
  glow.addColorStop(0, "rgba(0,0,0,0)");
  glow.addColorStop(0.75, "rgba(120,60,120,0.18)");
  glow.addColorStop(1, "rgba(180,90,110,0.28)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // A soft moon high up
  const mx = w * 0.72;
  const my = h * 0.2;
  const moon = ctx.createRadialGradient(mx, my, 2, mx, my, 60);
  moon.addColorStop(0, "rgba(220,225,245,0.9)");
  moon.addColorStop(0.4, "rgba(180,190,220,0.25)");
  moon.addColorStop(1, "rgba(180,190,220,0)");
  ctx.fillStyle = moon;
  ctx.fillRect(mx - 60, my - 60, 120, 120);

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// The garage forecourt / apron: a poured concrete pad the cars sit on in front
// of the door. Oil-darkened concrete with heavy engine-bay stains, faded yellow
// parking-bay lines around the door, tyre skid marks and expansion-joint grooves
// + cracks. Mapped ONCE across the pad (repeat 1,1). Canvas X = pad width, canvas
// Y = depth (top = garage face, bottom = road edge).
export function makeApronTexture(seed = 4, bays = true): THREE.CanvasTexture {
  const w = 1024;
  const h = 256;
  const cvs = document.createElement("canvas");
  cvs.width = w;
  cvs.height = h;
  const ctx = cvs.getContext("2d")!;
  const rng = mulberry32(seed);

  // oil-darkened concrete base
  ctx.fillStyle = "#3a3c42";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = rng() > 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.07)";
    ctx.fillRect(rng() * w, rng() * h, 2, 2);
  }

  // expansion-joint grooves splitting the pad into slabs
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 2;
  for (const fx of [0.34, 0.66]) {
    ctx.beginPath();
    ctx.moveTo(w * fx, 0);
    ctx.lineTo(w * fx, h);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, h * 0.5);
  ctx.lineTo(w, h * 0.5);
  ctx.stroke();

  // faded yellow parking-bay lines framing the door (door ~ centre 40% of width).
  // Skipped for the interior floor (bays=false), which just tiles the concrete.
  if (bays) {
    ctx.strokeStyle = "rgba(210,180,70,0.5)";
    ctx.lineWidth = 6;
    for (const bx of [0.3, 0.7]) {
      ctx.beginPath();
      ctx.moveTo(w * bx, h * 0.08);
      ctx.lineTo(w * bx, h * 0.92);
      ctx.stroke();
    }
    // a faded stop line near the door
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.18);
    ctx.lineTo(w * 0.7, h * 0.18);
    ctx.stroke();
  }

  // heavy oil stains concentrated where an engine bay would sit (upper-centre)
  for (let i = 0; i < 10; i++) {
    const cx = w * (0.35 + rng() * 0.3);
    const cy = h * (0.2 + rng() * 0.4);
    const r = 20 + rng() * 55;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    g.addColorStop(0, `rgba(0,0,0,${0.3 + rng() * 0.35})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  // tyre skid marks streaking toward the road
  for (let i = 0; i < 4; i++) {
    const x = w * (0.32 + rng() * 0.36);
    ctx.strokeStyle = `rgba(0,0,0,${0.25 + rng() * 0.2})`;
    ctx.lineWidth = 6 + rng() * 6;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.3);
    ctx.bezierCurveTo(x + (rng() - 0.5) * 40, h * 0.6, x + (rng() - 0.5) * 60, h * 0.8, x + (rng() - 0.5) * 30, h);
    ctx.stroke();
  }

  // cracks radiating along the slab
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  for (let i = 0; i < 5; i++) {
    let x = rng() * w;
    let y = rng() * h;
    ctx.lineWidth = 1 + rng();
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 3; j++) {
      x += (rng() - 0.5) * 70;
      y += (rng() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
