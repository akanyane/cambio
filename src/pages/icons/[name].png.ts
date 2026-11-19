import type { APIRoute, GetStaticPaths } from 'astro';
import { ICONS, renderIcon } from '../../lib/images';

export const getStaticPaths: GetStaticPaths = () => Object.keys(ICONS).map((name) => ({ params: { name } }));

export const GET: APIRoute = async ({ params }) =>
  new Response(await renderIcon(String(params.name)), { headers: { 'Content-Type': 'image/png' } });
