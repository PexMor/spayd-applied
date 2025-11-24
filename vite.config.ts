import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  plugins: [preact()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        simple: resolve(__dirname, "simple.html"),
        batch: resolve(__dirname, "batch.html"),
      },
    },
  },
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
});
