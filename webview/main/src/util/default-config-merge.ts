import { getDefaults } from '@piying/view-angular-core';
import { defaultsDeep } from 'es-toolkit/compat';

import { CONNECT_POINT } from '../page/workflow/custom-node/const';
import { RUNNER_ORIGIN_OUTPUT, WebviewNodeConfig } from '@bridge/share';
import * as v from 'valibot';
export function defaultConfigMerge(
  config: WebviewNodeConfig,
  schema: v.BaseSchema<any, any, any> | undefined,
) {
  const { disableConnect, outputs, label, nodeMode, initData } = config;
  let handle: { input?: any[]; output: any[] } = {
    output: nodeMode === 'condition' ? [] : [RUNNER_ORIGIN_OUTPUT],
  };
  if (!disableConnect) {
    handle = { ...handle, input: [CONNECT_POINT] };
  }

  if (outputs) {
    handle.output.push(...outputs);
  }
  return defaultsDeep(
    Object.keys(handle).length ? { data: { handle } } : {},
    schema ? getDefaults(schema) : {},
    initData?.(),
    label ? { data: { title: label } } : {},
  );
}
