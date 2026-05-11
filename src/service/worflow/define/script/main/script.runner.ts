import { inject } from 'static-injector';

import { NodeRunnerBase } from '@shenghuabi/workflow';

import { runInNewContext } from 'node:vm';
import { deepClone } from '../../../../../share';
import { WorkspaceService } from '../../../../workspace.service';
import { path } from '@cyia/vfs2';

import zod from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import * as yaml from 'yaml';
import { LogFactoryService } from '../../../../log.service';

export class ScriptRunner extends NodeRunnerBase {
  #channel = inject(LogFactoryService).getLog('workflow');
  #workspace = inject(WorkspaceService);
  override async run() {
    // let nodeResult = v.parse(SCRIPT_NODE_DEFINE, this.node);

    const contextObj = this.inputs$$();
    const params = deepClone(contextObj);
    if (!this.node.data.value) {
      throw new Error(`代码为空`);
    }
    const typescriptPkg = await import('typescript');
    const { ModuleKind, ScriptTarget, transpile } = typescriptPkg.default;
    const code = transpile(`(async()=>{${this.node.data.value}})()`, {
      target: ScriptTarget.ES2022,
      module: ModuleKind.CommonJS,
    });
    // fs path 变量
    const result = await runInNewContext(code, {
      parameters: params,
      util: {
        /** 可以读取工作区 */
        fs: this.#workspace.vfs,
        path: path,
        zod: zod,
        zodToJsonSchema: zodToJsonSchema,
        yaml: yaml,
      },
      require,
      console: this.#log,
    });
    return async (outputName: string) => {
      return result(outputName);
    };
  }
  #log = {
    log: (...args: any[]) => this.#channel.info(...args),
    error: (...args: any[]) => this.#channel.failed(...args),
  };
}
