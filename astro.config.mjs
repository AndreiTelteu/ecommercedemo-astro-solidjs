import { defineConfig } from 'astro/config';
import solidJs from "@astrojs/solid-js";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";
import { astroImageTools } from "astro-imagetools";
import netlify from '@astrojs/netlify/functions';
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [
    solidJs(),
    // prefetch(),
    // sitemap(),
    // astroImageTools,
  ],
  // adapter: netlify(),
  adapter: vercel(),
  output: 'server'
});