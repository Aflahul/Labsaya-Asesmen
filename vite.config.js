import { defineConfig } from "vite";
import fs from "node:fs/promises";
const proxy = {
  "/api": { target: "http://127.0.0.1:3000", changeOrigin: false },
};
export default defineConfig({
  server: { proxy },
  preview: { proxy },
  build: { chunkSizeWarningLimit: 1600 },
  plugins: [
    {
      name: "offline-cache",
      async closeBundle() {
        const assets = (await fs.readdir("dist/assets")).map(
          (n) => "/assets/" + n,
        );
        const version = assets.join("|");
        await fs.writeFile(
          "dist/sw.js",
          `const CACHE=${JSON.stringify("pulau-" + Buffer.from(version).toString("base64").slice(-40))};const ASSETS=${JSON.stringify(["/", ...assets])};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pulau-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||e.request.method!=='GET'||u.pathname.startsWith('/api/'))return;if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.match('/',{ignoreVary:true})));else e.respondWith(caches.match(e.request,{ignoreVary:true}).then(r=>r||fetch(e.request)));});`,
        );
      },
    },
  ],
});
