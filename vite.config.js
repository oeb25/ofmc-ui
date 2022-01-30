import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import monacoEditorPlugin from "vite-plugin-monaco-editor"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      $: resolve("./src/"),
    },
  },
  plugins: [
    react(),
    monacoEditorPlugin()
  ],
});
