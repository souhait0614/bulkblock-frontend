import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import { createHtmlPlugin } from "vite-plugin-html"

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0",
  },
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
  plugins: [
    svelte(),
    createHtmlPlugin({
      minify: true,
    }),
  ],
})
