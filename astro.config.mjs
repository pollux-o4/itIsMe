import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://pollux-o4.github.io",
  base: "/itIsMe",
  trailingSlash: "always",
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  devToolbar: { enabled: false },
  // One small stylesheet: inlining it removes the only render-blocking request before first paint.
  build: { inlineStylesheets: "always" },
});
