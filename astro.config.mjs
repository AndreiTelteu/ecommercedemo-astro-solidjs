import { defineConfig } from 'astro/config';
import solid from "@astrojs/solid-js";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";
import netlify from '@astrojs/netlify/functions';
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  integrations: [solid(), prefetch(), sitemap()],
  adapter: netlify(),
  output: 'server'
});