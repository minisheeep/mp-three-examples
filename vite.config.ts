import glsl from 'vite-plugin-glsl';
import { visualizer } from 'rollup-plugin-visualizer';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { defineConfig, normalizePath } from 'vite';
import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';
import * as fs from 'node:fs';
import { globSync } from 'glob';
import { basename } from 'node:path/win32';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = import.meta.dirname;
const resolveSrc = resolve.bind(null, __dirname, './src');
const resolveOfficialExample = resolveSrc.bind(null, 'official/examples');

export default defineConfig(({ mode, command }) => {
  const officialExamplePath = normalizePath(resolveOfficialExample());

  const officialExamples = globSync('[^$]*.js', { cwd: resolveOfficialExample() });
  const isBuild = command === 'build';
  return {
    publicDir: isBuild ? false : 'public',
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: {
        host: 'host.docker.internal',
        port: 4879
      }
    },
    resolve: {
      alias: {
        '@': resolveSrc()
      },
      extensions: ['.ts', '.tsx', '.js']
    },
    build: {
      minify: false,
      lib: {
        entry: {
          'official/index': resolveSrc('official/index.ts'),
          'official/common': resolveSrc('official/common.scss'),
          ...Object.fromEntries(
            officialExamples.map((file) => {
              return ['official/examples/' + basename(file, '.js'), resolveOfficialExample(file)];
            })
          )
        },
        formats: ['es'],
        // fileName: (format, entryName) => `${entryName}.js`,
        cssFileName: 'common'
      },
      rollupOptions: {
        output: {
          chunkFileNames: '[name].js'
          // manualChunks(id) {
          //   const normalizeId = normalizePath(id);
          //   if(normalizeId.startsWith(officialExamplePath)){
          //     return normalizeId
          //       .replace(officialExamplePath, 'official/examples').slice(0,-3);
          //   }
          // }
        },
        external: [
          'three',
          /three\/examples\/.*/,
          '@minisheep/three-platform-adapter',
          /@minisheep\/three-platform-adapter\/.*/,
          'vue',
          'three-bvh-csg',
          'three-gpu-pathtracer',
          'three-mesh-bvh',
          'three-subdivide'
          // 'web-ifc',
          // 'web-ifc-three'
        ]
      }
    },

    plugins: [
      dts({
        outDir: 'dist/official',
        include: ['src/official'],
        // rollupTypes: true,
        copyDtsFiles: true
        // afterBuild(emittedFiles) {
        //   for (const fileName of emittedFiles.keys()) {
        //     if (fileName.endsWith('style.d.ts')) {
        //       fs.unlinkSync(fileName);
        //     }
        //   }
        // }
      }),
      viteStaticCopy({
        targets: [
          {
            src: 'src/official/metaInfo.json',
            dest: './official',
            rename: 'official-examples.json'
          }
        ]
      }),
      glsl(),
      visualizer({
        emitFile: true
      }),

      react(),
      vue()
    ]
  };
});
