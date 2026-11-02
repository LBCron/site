// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import rehypeExternalLinks from 'rehype-external-links';

import { remarkReadingTime } from './scripts/remark-reading-time.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://hungovercoders.com',
  integrations: [mdx(), sitemap()],

  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },

  fonts: [
      {
          provider: fontProviders.local(),
          name: 'Atkinson',
          cssVariable: '--font-body',
          fallbacks: ['system-ui', 'sans-serif'],
          options: {
              variants: [
                  {
                      src: ['./src/assets/fonts/atkinson-regular.woff'],
                      weight: 400,
                      style: 'normal',
                      display: 'swap',
                  },
                  {
                      src: ['./src/assets/fonts/atkinson-bold.woff'],
                      weight: 700,
                      style: 'normal',
                      display: 'swap',
                  },
              ],
          },
      },
      {
          provider: fontProviders.google(),
          name: 'Lora',
          cssVariable: '--font-display',
          fallbacks: ['Georgia', 'Cambria', 'serif'],
          weights: [600, 700],
          styles: ['normal'],
      },
      {
          provider: fontProviders.google(),
          name: 'JetBrains Mono',
          cssVariable: '--font-mono',
          fallbacks: ['Menlo', 'Consolas', 'monospace'],
          weights: [400, 700],
          styles: ['normal'],
      },
	],

  adapter: cloudflare({ prerenderEnvironment: 'node' }),
});