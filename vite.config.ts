import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    outDir: 'docs/assets',
    emptyOutDir: false,
    rollupOptions: {
      preserveEntrySignatures: 'exports-only',
      input: {
        app: resolve(__dirname, 'assets/ts/app.ts'),
        graphics_visualizer: resolve(__dirname, 'assets/ts/graphics_visualizer.ts'),
        noop_visualizer: resolve(__dirname, 'assets/ts/noop_visualizer.ts'),
        value_visualizer: resolve(__dirname, 'assets/ts/value_visualizer.ts'),
        array_visualizer: resolve(__dirname, 'assets/ts/array_visualizer.ts'),
        workgroup_visualizer: resolve(__dirname, 'assets/ts/workgroup_visualizer.ts'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'css/[name].[ext]',
      },
    },
  },
});
