import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Port 5173 is Ezra's work dev server — keep the garage off it. Pinned to 3002
// (strictPort) so the built-in preview binds the right port however the harness
// launches it. See .claude/launch.json.
export default defineConfig({
  plugins: [react()],
  server: { port: 3002, strictPort: true },
});
