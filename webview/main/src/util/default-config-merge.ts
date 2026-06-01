import { getDefaults } from '@piying/view-angular-core';
import { defaultsDeep } from 'es-toolkit/compat';

import {
  deepClone,
  HandleNode,
  RUNNER_ORIGIN_OUTPUT,
  WebviewNodeConfig,
} from '@bridge/share';
import * as v from 'valibot';
export function defaultConfigMerge(
  config: WebviewNodeConfig,
  schema: v.BaseSchema<any, any, any> | undefined,
) {
  const { outputs, label, nodeMode, initData } = config;
  const handle: { output: HandleNode[][] } = {
    output: [],
  };
  if (outputs) {
    handle.output.push(...deepClone(outputs));
  } else {
    handle.output.push(deepClone(RUNNER_ORIGIN_OUTPUT));
  }
  return defaultsDeep(
    Object.keys(handle).length ? { data: { handle } } : {},
    { data: { config: { value: schema ? getDefaults(schema) : {} } } },
    initData?.(),
    label ? { data: { title: label } } : {},
  );
}
