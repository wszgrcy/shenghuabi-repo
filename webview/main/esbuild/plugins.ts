import path from 'path';

import type { Plugin } from 'esbuild';
import assert from 'assert';
const defineTitlePlugin: Plugin = {
  name: 'rewrite-path-plugin',
  setup(build) {
    build.initialOptions.conditions??=[]
    build.initialOptions.conditions=[...build.initialOptions.conditions,'production']

    let cwd = process.cwd();
    let nmDir = path.join(cwd, 'node_modules');
    let list = [
      'valibot',
      '@piying/view-angular',
      '@piying/view-angular-core',
      'lodash-es',
      'uuid',
      'zod',
      'rfdc',
      'react',
      'react-dom',
      'zustand',
      '@xyflow/react',
      'marked',
      'rxjs',
    ];

    assert(typeof (build.initialOptions.entryPoints as any) === 'object');
    assert((build.initialOptions.entryPoints as any)['main']);
    (build.initialOptions.entryPoints as any)['client'] = path.join(
      process.cwd(),
      './src/export/client.ts',
    );
    build.onResolve(
      { filter: new RegExp(`^(${list.join('|')})$`) },
      (resolve) => {
        if (resolve.pluginData?.resolved) {
          return;
        }
        return build.resolve(resolve.path, {
          kind: resolve.kind,
          pluginData: { resolved: true },
          resolveDir: nmDir,
        });
      },
    );
  },
};
export default defineTitlePlugin;
