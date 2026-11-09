// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [mdx(), sitemap(), react()],
  output: "static",
  // Astro 7 defaults to "jsx", which strips whitespace between inline elements.
  // Keep the Astro 6 output until the pages are audited for that change.
  compressHTML: true,

  vite: {
    plugins: [tailwindcss()],
  },
});
