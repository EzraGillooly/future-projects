# Future Builds — 3D Garage

An interactive night-time JDM street scene built with **React Three Fiber**. You start
across the street from a tuning garage, click the glowing roll-up door to step up to the
entrance, and click a car inside to read about one of the projects it represents.

Each car in the garage is a "future build" — a project idea, mapped to a real low-poly JDM
model (RX-7, GTR, AE86, 180SX). The street around it (convenience store, neon signs,
traffic, rain, wet reflections) is procedurally textured — no external image assets.

## Run it

```bash
npm install
npm run dev      # http://localhost:5180
npm run build
```

## Stack

React 19 · React Three Fiber · three.js · `@react-three/drei` · `@react-three/postprocessing` · Vite · TypeScript

## Assets

Low-poly `.glb` vehicle/prop models live in `public/models/` (sourced from Poly Pizza and
similar CC0/CC-BY libraries). Buildings, road, signage, and neon are generated procedurally
in `src/textures.ts`.
