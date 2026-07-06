import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Port 5173 is Ezra's work dev server — keep the garage off it.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
});
