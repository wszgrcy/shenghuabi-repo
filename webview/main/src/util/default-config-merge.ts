import { getDefaults } from '@piying/view-angular-core';
import { defaultsDeep } from 'es-toolkit/compat';

import {
  deepClone,
  RUNNER_ORIGIN_OUTPUT,
  WebviewNodeConfig,
} from '@bridge/share';
import * as v from 'valibot';
export function defaultConfigMerge(
  config: WebviewNodeConfig,
  schema: v.BaseSchema<any, any, any> | undefined,
) {
  const { outputs, label, nodeMode, initData } = config;
  const handle: { input?: any[]; output: any[] } = {
    output: nodeMode === 'condition' ? [] : [RUNNER_ORIGIN_OUTPUT],
  };

  if (outputs) {
    handle.output.push(...deepClone(outputs));
  }
  return defaultsDeep(
    Object.keys(handle).length ? { data: { handle } } : {},
    schema ? getDefaults(schema) : {},
    initData?.(),
    label ? { data: { title: label } } : {},
  );
}
