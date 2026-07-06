// Shared data source for the Future Builds garage.
// One entry per car. Salvaged from the old backlog index.html (seed data + vocabulary)
// before that file was retired in favour of the 3D garage.
//
// cameraPose / engineAnchor are the 3D fields: cameraPose is where the camera glides to
// when this car's engine is clicked, engineAnchor is the world position the popup pins to.
// They get filled in per car during Phase 0 (greybox), once the scene layout is nailed.

export type ProjectType =
  | "website"
  | "widget"
  | "ml"
  | "tool"
  | "app"
  | "game"
  | "other";

export type ProjectStatus =
  | "idea"
  | "next"
  | "building"
  | "shipped"
  | "parked";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  blurb: string;
  tags: string[];
  link: string;
  // 3D placement — added per car in Phase 0.
  cameraPose?: CameraPose;
  engineAnchor?: Vec3;
}

export const TYPES: { id: ProjectType; label: string }[] = [
  { id: "website", label: "Website" },
  { id: "widget", label: "Widget" },
  { id: "ml", label: "ML model" },
  { id: "tool", label: "Tool" },
  { id: "app", label: "App" },
  { id: "game", label: "Game" },
  { id: "other", label: "Other" },
];

export const STATUSES: { id: ProjectStatus; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "next", label: "Next up" },
  { id: "building", label: "Building" },
  { id: "shipped", label: "Shipped" },
  { id: "parked", label: "Parked" },
];

export const PROJECTS: Project[] = [
  {
    id: "dream-garage",
    title: "Dream Garage",
    type: "website",
    status: "building",
    blurb:
      "Late-night JDM city-drive site. Turn down different streets into different garages of dream cars, with changing night-city views. A fun way to log every car I want to own.",
    tags: ["JDM", "interactive", "night-drive"],
    link: "",
  },
  {
    id: "now-building-widget",
    title: "Now-Building status widget",
    type: "widget",
    status: "idea",
    blurb:
      "Small embeddable widget showing what I'm currently building / listening to. Drop it into the portfolio site.",
    tags: ["portfolio", "embed"],
    link: "",
  },
  {
    id: "jdm-car-spotter",
    title: "JDM car spotter",
    type: "ml",
    status: "idea",
    blurb:
      "Vision model that names a JDM car from a photo. Good dataset practice, ties into the car obsession.",
    tags: ["vision", "dataset"],
    link: "",
  },
  {
    id: "screenshot-filer",
    title: "Screenshot filer (menu bar)",
    type: "tool",
    status: "idea",
    blurb:
      "Tiny macOS menu-bar tool that auto-files screenshots by app and date. Extends the Downloads janitor idea.",
    tags: ["macOS", "automation"],
    link: "",
  },
];
