import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name].[ext]",
        manualChunks: undefined,
        // chunkFileNames: "assets/[name].js",
        entryFileNames: "assets/[name].js",
      },
    },
  },
  plugins: [svelte()],
})
