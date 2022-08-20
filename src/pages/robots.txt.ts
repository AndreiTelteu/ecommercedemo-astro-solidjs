import type { APIContext } from 'astro';

export async function get({ request }: APIContext) {
  let parsed = new URL(request.url);
  return {
    headers: {
      'Content-Type': 'text/plain',
    },
    body: `User-agent: *
Disallow:
Sitemap: ${parsed?.origin}/sitemap.xml`,
  };
};
