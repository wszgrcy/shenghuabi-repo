let path = require('path')
let assert = require('assert')

const defineTitlePlugin = {
  name: 'rewrite-path-plugin',
  setup(build) {
    build.initialOptions.conditions ??= []
    build.initialOptions.conditions = [...build.initialOptions.conditions, 'production']
    build.initialOptions.define={
      ...build.initialOptions.define,
      'process.platform':process.platform,
      'process.arch':process.arch,
    }
    let cwd = process.cwd();
    let nmDir = path.join(cwd, 'node_modules');
    let list = [

    ];

    assert(typeof (build.initialOptions.entryPoints) === 'object');
    assert((build.initialOptions.entryPoints)['main']);
    (build.initialOptions.entryPoints)['client'] = path.join(
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
module.exports = [defineTitlePlugin]

// const path1 = require('path')
// const plugins = require(path1.join(context.workspaceRoot, 'esbuild/plugins.js'))
// extensions = { codePlugins: plugins }