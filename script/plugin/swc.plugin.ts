import {
  Options as SWCOptions,
  Output,
  transform,
  transformSync,
} from '@swc/core';
import { Plugin, OnLoadArgs, OnLoadResult } from 'esbuild';
import path, { dirname } from 'path';
import fs from 'fs/promises';
import { defaultsDeep } from 'lodash-es';

export const swcPlugin = (options: {
  isProd: boolean;
  define: Record<string, string>;
}): Plugin => {
  let swcOptions: SWCOptions = {
    swcrc: false,
    // filename: args.path,
    jsc: {
      transform: {
        optimizer: {
          // 插入环境变量用的
          globals: { vars: options.define },
        },
        decoratorVersion: '2022-03',
      },
      externalHelpers: true,
      baseUrl: process.cwd(),
      paths: {
        '@i18n': ['./src/i18n'],
        '@global': ['./script/metadata/index.ts'],
        '@polyfill/*': ['./src/polyfill/*'],
        '@share/util/*': ['./src/util/*'],
        '@share/valibot': ['./src/share/valibot/main-index.ts'],
        '@share/valibot/define': ['./src/share/valibot/define.ts'],
        '@shenghuabi/sdk/server': ['./src/export/server.ts'],
      },
      parser: {
        syntax: 'typescript',
        tsx: false,
        decorators: true,
      },
      target: 'es2023',
      loose: false,
      minify: {
        compress: {
          passes: 4,
        },
        mangle: options.isProd,
      },
    },
    module: {
      type: 'nodenext',
    },
    minify: options.isProd,
    isModule: true,
    sourceMaps: 'inline',
    inlineSourcesContent: !options.isProd,
  };
  return {
    name: 'esbuild:swc:minify',
    setup: (builder) => {
      if (!options.isProd) {
        return;
      }
      let list = ['@shb','@cyia','@shenghuabi'];
      builder.onLoad({ filter: /\.(ts|js|mts|mjs|cts|cjs)$/ }, async (args: OnLoadArgs) => {
        const code = await fs.readFile(args.path, 'utf-8');
        let result = await transform(code, {
          ...swcOptions,
          filename: args.path,
          sourceMaps: list.some((str) => args.path.includes(str))
            ? 'inline'
            : args.path.includes('node_modules')
              ? false
              : 'inline',
        });
        return {
          contents: result.code,
          loader: 'js',
        };
      });
    },
  };
};
