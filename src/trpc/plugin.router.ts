import * as v from 'valibot';
import { t } from './t';

import * as vscode from 'vscode';
import { deepEqual } from 'fast-equals';

const config = vscode.workspace.getConfiguration(`shb`);
export const PluginConfigRouter = t.router({
  init: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const definePath = (ctx as any)['definePath'];
    const packageJson = (ctx as any)['packageJson'];
    const configValue = config.get(`${packageJson.name}`);
    return {
      definePath: new URL(
        `shb://flow-vfs/config-define?${new URLSearchParams([
          ['type', 'plugin'],
          ['filePath', definePath],
          ['content-type', 'text/javascript'],
        ])}`,
      ).toString(),
      value: configValue,
    };
  }),
  set: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const packageJson = (ctx as any)['packageJson'];
    for (const key in input) {
      const currentValue = input[key];
      const oldValue = config.get(`${packageJson.name}.${key}`);
      if (deepEqual(oldValue, currentValue)) {
        continue;
      }
      await config.update(`${packageJson.name}.${key}`, currentValue);
    }
  }),
  // set: t.procedure.subscription(({ input, ctx }) => {
  //   return observable<any>((emit) => {});
  // }),
});
