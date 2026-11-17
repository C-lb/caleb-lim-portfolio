import { defineConfig } from 'astro/config';

// public/meet/index.html is the "Meet Caleb Lim" prototype, a plain static page
// the topbar's version switch links to. The live host serves it at /meet/, but
// the dev server only finds files in public/ by their full name, so in dev
// (`npm run dev`, `npm run studio`) point /meet/ at the file. Not used in a build.
const serveMeetInDev = {
  name: 'serve-meet-in-dev',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const [path, query] = (req.url ?? '').split('?');
      if (path === '/meet' || path === '/meet/') req.url = '/meet/index.html' + (query ? `?${query}` : '');
      next();
    });
  },
};

export default defineConfig({
  // Absolute URLs for OG/Twitter image tags. Update to the custom domain when
  // one is connected; default is the Vercel project domain.
  site: 'https://caleb-lim-portfolio.vercel.app',
  vite: { plugins: [serveMeetInDev] },
});
