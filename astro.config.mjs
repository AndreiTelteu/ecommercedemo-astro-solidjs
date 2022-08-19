import { defineConfig } from 'astro/config';
import solidJs from "@astrojs/solid-js";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";
import { astroImageTools } from "astro-imagetools";

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs(), prefetch(), sitemap(), astroImageTools],
  output: 'server'
});