import { Plugin } from 'esbuild';
import path from 'path';

const namespace = 'import-to-require';

export const importRequirePlugin = (externals: string[]): Plugin => {
  return {
    name: namespace,
    setup(build) {
      // 导入文件cjs import esm
      build.onResolve({ filter: new RegExp('buffer-crc32') }, async (args) => {
        if (!args.resolveDir.endsWith('yazl')) {
          return null;
        }

        return {
          path: path.join(
            process.cwd(),
            'node_modules/buffer-crc32/dist/index.cjs',
          ),
        };
      });
      build.onResolve(
        {
          filter: new RegExp('^(mammoth|epub2)$'),
        },
        async (args) => {
          if (args.kind !== 'dynamic-import') {
            return null;
          }
          if (
            args.pluginData?.resolved ||
            args.resolveDir.endsWith('import-hook')
          ) {
            return null;
          }
          return {
            path: path.join(__dirname, `../import-hook/${args.path}.mjs`),
            pluginData: { resolved: true },
          };
        },
      );
      build.onResolve(
        {
          filter: new RegExp('^(' + externals.join('|') + ')$'),
        },
        (args) => ({
          path: args.path,
          namespace: namespace,
        }),
      );

      build.onLoad(
        {
          filter: /.*/,
          namespace,
        },
        (args) => {
          const contents = `module.exports =ɵrequire("${args.path}");`;
          return {
            contents,
          };
        },
      );
    },
  };
};
