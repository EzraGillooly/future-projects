import type { Project } from "../data/projects";

// Neon card that rises out of the engine bay when a car is focused.
export function ProjectPopup({ project }: { project: Project }) {
  return (
    <div
      style={{
        width: 240,
        padding: "14px 16px",
        borderRadius: 14,
        background: "rgba(10, 12, 24, 0.86)",
        border: "1px solid rgba(255, 79, 216, 0.4)",
        boxShadow: "0 10px 40px rgba(255, 79, 216, 0.25)",
        color: "#e7ebff",
        fontFamily: "system-ui, sans-serif",
        backdropFilter: "blur(8px)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#67e8f9",
        }}
      >
        {project.type} · {project.status}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, margin: "4px 0 8px" }}>
        {project.title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: "#b9c1e6" }}>
        {project.blurb}
      </div>
      {project.tags.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: "#8891c4" }}>
          {project.tags.map((t) => `#${t}`).join("  ")}
        </div>
      )}
    </div>
  );
}
