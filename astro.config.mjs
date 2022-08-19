import { defineConfig } from 'astro/config';
import solidJs from "@astrojs/solid-js";
import image from "@astrojs/image";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs(), image(), prefetch(), sitemap()],
  output: 'server'
});