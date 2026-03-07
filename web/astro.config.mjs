// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

import { exec } from "child_process";
import path from "path";

function vaultWatcherPlugin() {
  return {
    name: 'vault-watcher',
    configureServer(server) {
      const vaultPath = path.resolve('../vault');
      server.watcher.add(vaultPath);
      server.watcher.on('all', (event, file) => {
        if (file.startsWith(vaultPath) && file.endsWith('.md')) {
          console.log(`\n[Vault] File ${event}: ${file}. Running indexer...`);
          exec('cargo run --manifest-path ../indexer/Cargo.toml -- --vault ../vault --db ../data/notes.db', (err, stdout, stderr) => {
            if (err) {
              console.error('[Vault] Indexer error:', err);
              return;
            }
            console.log('[Vault] Indexer finished. Reloading page.');
            server.ws.send({ type: 'full-reload', path: '*' });
          });
        }
      });
    }
  };
}

// https://astro.build/config
export default defineConfig({
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), vaultWatcherPlugin()],
  },
});
