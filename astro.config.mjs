import { defineConfig } from 'astro/config';
import solidJs from "@astrojs/solid-js";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";
import netlify from '@astrojs/netlify/functions';
import suidPlugin from "@suid/vite-plugin";

// https://astro.build/config
export default defineConfig({
  integrations: [
    solidJs(),
    prefetch(),
    sitemap(),
  ],
  adapter: netlify(),
  output: 'server',
  vite: {
    // plugins: [suidPlugin()],
    ssr: {
      // external: [
      //   '@suid/material',
      //   '@suid/base',
      //   '@suid/system',
      //   '@suid/css',
      //   '@suid/utils',
      //   '@suid/styled-engine',
      // ],
      noExternal: [
        '@suid/material',
        '@suid/base',
        '@suid/system',
        '@suid/css',
        '@suid/utils',
        '@suid/styled-engine',
      ],
    },
  },
});