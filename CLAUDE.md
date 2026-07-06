# CLAUDE.md: future-projects

> Operating manual and expert brief for Ezra's future-projects hub. Read this first.
> When a chat is about this project, you are its expert. Loads on top of the Overall and
> Personal layers.
>
> **Learning Mode is the default here**; Ezra is comfortable with web dev (React / Next /
> Astro) but new to 3D on the web, so briefly explain the concepts and the why as they
> come up.

## Status (as of 2026-07-06)

- **Layout decided:** this folder is the root of the 3D app. The old static prototypes
  (`index.html` backlog + `dream-garage.html` concept) have been **retired** — their seed
  project data and the type/status vocabulary were salvaged into `data/projects.ts` first.
- **Seed data (`data/projects.ts`):** in place. Typed `Project` model, `TYPES`/`STATUSES`
  vocab, and the four seed projects. This is the single data source the garage reads from.
  It carries `cameraPose` / `engineAnchor` fields, stubbed until Phase 0 sets them per car.
- **3D garage — Phase 0 (greybox) done.** R3F + Vite + TS app scaffolded at the folder
  root (`src/App.tsx`). Working: establishing street shot, two rows of cube "cars" from
  `data/projects.ts`, hover highlight, click-engine → ~1s camera glide to a 3/4 pose →
  `<Html>` popup with that project's data, Escape / floor-click returns to the
  establishing shot. Camera-on-rails via a per-frame lerp (`CameraRig`). Dev on port 5180
  (5173 is Ezra's work server). `npm run dev` / `npm run build` both clean.
- **Next: Phase 1 (dress).** Swap cube cars for low-poly models, light for mood; then
  Phase 2 atmosphere (rain, bloom, wet floor, lofi bed), Phase 3 content + a11y fallback.
- Folder is **not a git repo** yet; init before the first commit.

## What this project is

The home for everything Ezra wants to build someday: an immersive **3D garage** you move
around inside, where **each car is a project**. A chill late-night garage that is the star
way to browse the backlog. Projects live in `data/projects.ts`; the scene reads from it, so
adding a project means adding a car. The rest of this file is the build brief.

## Current contents of this folder

- `CLAUDE.md` — this brief.
- `data/projects.ts` — the single data source (typed `Project` model, `TYPES`/`STATUSES`
  vocab, seed projects). Salvaged from the retired backlog.

## The vision (3D garage)

An interactive, almost-3D **chill late-night garage** you can move around inside. The
establishing shot looks in from a rainy neon-lit street at an open garage. Inside: a loft
at the back, and under the loft a couch with a TV area and a rug. Along both walls sit
cars with their engine bays open. **Clicking on an engine glides the camera to the front
of that car and a popup rises out of the engine bay showing that project's details.**

Each car is a project (pulled from the Future Builds backlog). It should feel like a place
and a mood, not a game or a normal website. Chill, rainy, neon, lofi.

## What it is underneath

An interactive 3D web experience (a "3D room" / diorama), not a page. It breaks into:
scene/layout, assets/models, lighting+mood, camera system, interaction (raycast/hotspots),
HTML overlays (the popup), atmosphere (rain, neon, wet floor), and audio.

## The single most important design decision: camera on rails

**Do not build a free-roam camera.** One establishing shot plus one saved camera pose per
car. Clicking an engine tweens the camera to that pose (about 1s ease) and fades in the
popup; closing returns to the establishing shot. This one choice makes it cinematic,
controllable, and dramatically less work. Resist the urge to make it a walk-around.

## Recommended stack

Primary (recommended): **React Three Fiber (R3F) + Vite + TypeScript.** Fits Ezra's
React/portfolio world and scales from prototype to the real thing.
- `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`.

Alternative for a fast throwaway: a single self-contained **Three.js HTML file** via CDN
importmap. Simplest to open, but does not scale. Fine only for a quick feel test.

Make the final call in Phase 0. Greybox first either way.

### R3F / drei helpers to lean on
- `useGLTF` for models (glTF / glb).
- drei `CameraControls` (or a manual lerp) for the glide-to-car move; save a pose per car.
- drei `<Html>` for the popup pinned to the engine bay's 3D position.
- drei `MeshReflectorMaterial` for the wet, reflective garage floor.
- `@react-three/postprocessing` `Bloom` for the neon glow.
- `Environment` + lights: warm tungsten loft pool, cold neon rim; `emissive` for the signs.
- Rain: instanced points or a cheap shader; low particle count on mobile.
- `useCursor` / `onPointerOver` for a hover affordance on interactive engines.

## Aesthetic direction

Late-night JDM garage. Deep near-black navy base, a warm tungsten pool of light in the
loft, neon magenta / cyan / amber signage, wet asphalt and reflections out on the street,
haze and rain streaks. Stylized, not photoreal. A looping **lofi hiphop + rain audio bed**
is core to the mood and cheap to add (a looping `<audio>` element started on first user
interaction so autoplay policies do not block it). Reference feel: Initial D night stages,
Tokyo backstreet garages, chill synthwave garage renders.

## Assets: the real cost driver

Code is the easy part. Models are where time and money go, especially cars with an open
engine bay. Strategy:
- Prefer **stylized / low-poly**. Reads great for this vibe and stays fast on phones.
- Free CC0 sources: Poly Pizza, Kenney, Quaternius. Mixed-license (check each): Sketchfab,
  CGTrader.
- **Fake the engine detail**: use a normal car model plus a close-up detail plane or a
  stylized engine prop shown on zoom, rather than a fully modeled bay.
- Export `.glb`; compress with Draco or meshopt; compress textures (ktx2 / basis).
- Photoreal, custom-modeled cars is a separate budget and wants a 3D artist. Not v1.

## Build plan (phased, greybox first)

- **Phase 0 — Greybox.** Whole scene in primitives (cubes for cars, a plane for the loft).
  Nail the layout, the click-engine to camera-glide to popup interaction, and the data
  wiring. Proves the feel in about a day, before spending a minute on art.
- **Phase 1 — Dress.** Swap primitives for low-poly models; light it for mood.
- **Phase 2 — Atmosphere.** Rain, neon bloom, wet reflections, the lofi + rain audio bed.
- **Phase 3 — Content + polish.** Each car's popup pulls from the project data; tune mobile
  and performance (LOD, Draco, texture compression); add the accessible fallback.

## Data model (cars = projects)

Keep scene and data separate so adding a project means adding a car. The shared source is
`data/projects.ts`; each `Project` is roughly
`{ id, title, type, status, blurb, tags, link, cameraPose?, engineAnchor? }`. The seed
projects and the `TYPES` / `STATUSES` vocabulary already live there. Phase 0 fills in
`cameraPose` / `engineAnchor` per car once the scene layout is set.

## Interaction spec

- Establishing shot on load, looking in from the street.
- Hover an engine: subtle highlight plus pointer cursor.
- Click an engine: camera eases (~1s) to that car's saved pose; popup fades in at the
  engine bay; slightly dim the rest of the scene.
- Close, click away, or Escape: popup out, camera returns to the establishing shot.

## Performance and accessibility floor

- Target 60fps on desktop; degrade on mobile (lower DPR, fewer rain particles, simpler
  lights).
- `prefers-reduced-motion`: cut rain and soften or skip camera moves.
- Provide a non-3D fallback: render `data/projects.ts` as a plain accessible list for
  reduced-motion / no-WebGL / screen-reader users. (The retired backlog was exactly this;
  rebuild a lean version from the same data source.)
- Lazy-load and code-split; compress every asset.

## Commands (once the 3D app is scaffolded at the folder root)

```bash
npm create vite@latest . -- --template react-ts
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm run dev
npm run build
```

Note: this folder is not a git repo yet. Initialize one before the first commit.

## Why this approach (reasoning, so it is not re-litigated)

Options considered: 2.5D parallax (fast, but fakes the camera and cannot really move to in
front of the car), Spline (real 3D, visual editor, less code, but a tool dependency), R3F /
Three.js (full control, owns the code, fits the stack), and pre-rendered video plus
hotspots (photoreal but canned). R3F won on control plus portfolio fit, with camera-on-
rails as the simplification that keeps it achievable. Spline stays a valid fallback if the
art-directing-in-code cost feels too high.

## Rules

Secrets, commits, copy style, and coding behavior all come from the Overall
(`~/.claude/CLAUDE.md`) and Personal (`Personal/CLAUDE.md`) layers, which load underneath
this file. Not restated here. The only project-local default: **Learning Mode is on** —
explain the why and the 3D concepts briefly before editing.
