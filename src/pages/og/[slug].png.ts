import type { APIRoute, GetStaticPaths } from 'astro';
import { OG_SLUGS, renderOg } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = () => OG_SLUGS.map((slug) => ({ params: { slug } }));

export const GET: APIRoute = async ({ params }) =>
  new Response(await renderOg(String(params.slug)), { headers: { 'Content-Type': 'image/png' } });
