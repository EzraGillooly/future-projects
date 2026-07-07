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
- **Vision pivoted (2026-07-06):** from an interior-only garage to the **night-time
  exterior tuning-shop** approach above (street → entrance → car). See the vision and build
  plan sections. Reusable tech from the first build carries over (camera-on-rails lerp,
  low-poly `CarModel`, neon `<Html>` popup, bloom + reflective floor).
- **3D app stack in place.** R3F + Vite + TS at the folder root, split into `layout.ts`,
  `App.tsx`, `Car*.tsx`, `ProjectPopup.tsx`. Dev on port 5180 (5173 is Ezra's work
  server). `npm run dev` / `npm run build` clean. Committed on `main`, local-only.
- **Built + verified (new vision):** street → click door → entrance → click car →
  camera hops to an angled 3/4 view over that car's open hood, info card rises from the
  engine bay. Cars park rear-to-wall, engines to the aisle. Interior magenta/cyan neon,
  wet reflective asphalt, bloom, vignette, night rain. Affordances: car hover-lift, popup
  fade/rise, contextual on-screen back button (+ Esc). Files: `layout.ts` (STREET /
  ENTRANCE + per-car poses), `App.tsx` (nav state + overlay), `Building.tsx`, `CarModel` /
  `Car` / `StreetCar`, `Rain.tsx`, `ProjectPopup.tsx`.
- **Deferred:** the lofi + rain **audio bed** (Phase 2) — needs a real loop file to bundle;
  scaffold only when the asset exists. Photoreal/GLB car models remain a later asset task.
- Repo is initialized (git, local only — no remote yet).

### Graphics pass done (2026-07-06)

- **Street view now from the LEFT** (`STREET` pose at `-X`). ✅
- **Graphics level-up:** ACES filmic tone mapping + exposure, MSAA via the composer, a
  self-contained neon night `Environment` (drei `Lightformer`s — no external HDRI) so the
  glossy car paint + glass reflect the scene; detailed `CarModel` (glass greenhouse, rims,
  mirrors, rear wing, tail-lights); rain as falling streaks; overhead power lines + road
  dashes; brighter bloom.

### Gotchas (learned the hard way — read before testing/editing interactions)

- **Invisible click hitboxes must render *something*.** R3F skips pointer events on meshes
  that are `visible={false}` **or** fully transparent (`opacity 0`). Use
  `<meshBasicMaterial colorWrite={false} depthWrite={false} />` — invisible, non-occluding,
  still raycastable. The garage-door hotspot relies on this.
- **Synthetic pointer events (Playwright `dispatchEvent`) don't reliably drive R3F raycasts
  in this heavier scene** — they silently no-op. Verify interactions with a *real*
  `page.locator('canvas').click()` (real input works fine), or drive state directly with a
  temporary `window.__go` hook. Don't conclude an interaction is broken from a failed
  synthetic click.

### Scenery detail via procedural textures (2026-07-06)

The fix for "everything looks like 3D rectangles" is **textures + emissive maps on simple
shapes**, not modelling detail. `src/textures.ts` draws them on an HTML canvas at load (no
external image files — CSP-safe): `makeFacadeTexture` (window grid, used as map +
emissiveMap so only windows glow), `makeStorefrontTexture` (glass/shelves/products for the
shop front), `makeSkylineTexture` (night-city backdrop plane). Neighbour buildings use
`FacadeBox`; the shop front panels are lit storefront windows; a far `Backdrop` plane adds
city depth. To add more "place" detail, extend this file with more canvas textures (signage,
kanji boards, AC units, posters) rather than more geometry. Seeded RNG keeps layouts stable
across reloads.

### Deferred (Ezra asked, not yet done)

- **Building differentiation** — the neighbour buildings are too uniformly square and share
  one facade seed. Vary their silhouettes (setbacks, different heights/widths, rooftop
  props) and give each its own facade seed/tint so they stop looking identical.

### Real car assets (for replacing the primitive cars)

Free glTF/`.glb` sources, low-poly first: **Poly Pizza** (poly.pizza, CC0, best fit),
**Kenney** (kenney.nl Car/Racing kits, CC0), **Quaternius** (CC0). Higher detail:
**Sketchfab** filtered to Downloadable + CC0/CC-BY (credit CC-BY). Drop `.glb` into
`public/models/`, load with drei `useGLTF`, swap per car; prefer Draco-compressed.

### Still open / next ideas

- Lofi + rain **audio bed** (needs a real loop file to bundle).
- Real low-poly `.glb` car/shop assets (sourcing + license) for another fidelity jump.
- Depth-of-field on the focused car shot; animate the roll-up door opening.
- Per-car paint colours; `prefers-reduced-motion` (cut rain / soften camera).

## What this project is

The home for everything Ezra wants to build someday, staged as a **night-time JDM tuning
shop** you approach from the street. You start across the road looking at the shop; you
click the open garage door to move up to the entrance; inside, **each car is a project**
you click for its details. Projects live in `data/projects.ts`; the scene reads from it, so
adding a project means adding a car inside the garage. The rest of this file is the build
brief.

## Current contents of this folder

- `CLAUDE.md` — this brief.
- `data/projects.ts` — the single data source (typed `Project` model, `TYPES`/`STATUSES`
  vocab, seed projects). Salvaged from the retired backlog.

## The vision (night-time tuning shop)

Reference: a real JDM tuning shop at night (think Advance Technical Factory) — a
corrugated-metal shop building with a lit sign, an open roll-up garage door glowing warm
from inside, vending machines by the door, cars parked out on the street, an apartment
block behind, power lines overhead, wet asphalt under street lamps and neon. Stylized
homage, not a replica.

The experience is a **two-hop camera journey**:

1. **Street (establishing).** Camera sits across the road at an angle, taking in the whole
   shop and its surroundings under night ambient light. The open garage door reads as a
   warm glowing invitation.
2. **Entrance.** Clicking the open garage door glides the camera across the street and up
   to the doorway (~1s ease), now looking into the garage.
3. **Cars.** Inside sit the project cars. Clicking a car lights it up and rises a neon
   `<Html>` popup with that project's details; the camera holds at the entrance. Escape
   backs out (car → deselect, then entrance → street).

Each **inside** car is a project (from `data/projects.ts`). The cars on the street are set
dressing only, not clickable. It should feel like a place and a mood — chill, rainy, neon,
lofi — not a game or a normal website.

## What it is underneath

An interactive 3D web experience (a diorama you look into), not a page. It breaks into:
scene/layout (street + shop + interior), assets/models, lighting+mood (night ambient, warm
interior spill, neon), camera system, interaction (raycast hotspots: the door + the cars),
HTML overlays (the popup), atmosphere (rain, neon, wet asphalt), and audio.

## The single most important design decision: camera on rails

**Do not build a free-roam camera.** The whole thing runs on a handful of saved poses —
`STREET`, `ENTRANCE`, and (if ever needed) per-car — that the camera tweens between (~1s
ease). Clicking the door goes street → entrance; clicking a car pops its card without
moving; Escape walks back out. This one choice makes it cinematic, controllable, and
dramatically less work. Resist the urge to make it a walk-around.

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

Late-night JDM street. Deep near-black navy base, a warm tungsten glow spilling out of the
open garage door, neon magenta / cyan / amber signage on the shop and surrounding
buildings, lit apartment windows, street-lamp pools, wet asphalt and reflections, haze and
rain streaks. Stylized, not photoreal. A looping **lofi hiphop + rain audio bed**
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

- **Phase 0 — Greybox.** Whole scene in primitives (boxes for the shop/buildings/cars, a
  plane for the street). Nail the layout, the street → entrance → car-popup camera flow,
  and the data wiring. Proves the feel before spending a minute on art.
- **Phase 1 — Dress.** Swap primitives for low-poly models; light it for mood (warm door
  spill, neon signage, street lamps, lit windows).
- **Phase 2 — Atmosphere.** Rain, neon bloom, wet asphalt reflections, the lofi + rain
  audio bed.
- **Phase 3 — Content + polish.** Each car's popup pulls from the project data; tune mobile
  and performance (LOD, Draco, texture compression); add the accessible fallback.

**Status note:** an earlier interior-only greybox (cars along the walls of a room, loft +
couch) was built and dressed before the vision changed to this exterior street approach.
Its reusable parts — camera-on-rails lerp, low-poly `CarModel`, the neon `<Html>` popup,
bloom + reflective-floor setup — carry straight over; the surrounding scene is being
rebuilt around the street → shop → interior layout.

## Data model (cars = projects)

Keep scene and data separate so adding a project means adding a car. The shared source is
`data/projects.ts`; each `Project` is roughly
`{ id, title, type, status, blurb, tags, link, cameraPose?, engineAnchor? }`. The seed
projects and the `TYPES` / `STATUSES` vocabulary already live there. Phase 0 fills in
`cameraPose` / `engineAnchor` per car once the scene layout is set.

## Interaction spec

- **Street shot on load**, across the road at an angle; the open garage door glows.
- Hover the door or a car: subtle highlight plus pointer cursor.
- Click the door: camera eases (~1s) to the `ENTRANCE` pose, looking into the garage.
- Click a car (at the entrance): it lights up, its neon popup rises, rest of the scene
  dims slightly; camera holds at the entrance.
- Escape / click away: step back out — a focused car deselects first, then entrance
  returns to the street shot.

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
