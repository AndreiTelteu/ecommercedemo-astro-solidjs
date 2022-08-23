import { defineConfig } from 'astro/config';
import solidJs from "@astrojs/solid-js";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";
import { astroImageTools } from "astro-imagetools";
import netlify from '@astrojs/netlify/functions';

// https://astro.build/config
export default defineConfig({
  integrations: [
    solidJs(),
    // prefetch(),
    // sitemap(),
    astroImageTools,
  ],
  adapter: netlify(),
  output: 'server'
});