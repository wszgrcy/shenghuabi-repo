import { getDefaults } from '@piying/view-angular-core';
import { defaultsDeep } from 'lodash-es';
import { CONNECT_POINT } from '../page/workflow/custom-node/const';
import { generateHandle, WebviewNodeConfig } from '@bridge/share';
import * as v from 'valibot';
export function defaultConfigMerge(
  config: WebviewNodeConfig,
  schema: v.BaseSchema<any, any, any> | undefined,
) {
  const { disableConnect, inputs, outputs, label, nodeMode, initData } = config;
  let handle: { input?: any[]; output: any[] } = {
    output:
      nodeMode === 'condition' ? [] : [[generateHandle('default', '输出')]],
  };
  if (!disableConnect) {
    handle = { ...handle, input: [CONNECT_POINT()] };
  }
  if (inputs) {
    handle.input ??= [];
    handle.input.push(
      ...inputs.map((list) =>
        list.map((item) => ({
          ...item,
          ...generateHandle(item.value, item.label),
        })),
      ),
    );
  }
  if (outputs) {
    handle.output.push(
      ...outputs.map((list) =>
        list.map((item) => ({
          ...item,
          ...generateHandle(item.value, item.label),
        })),
      ),
    );
  }
  return defaultsDeep(
    Object.keys(handle).length ? { data: { handle } } : {},
    schema ? getDefaults(schema) : {},
    initData(),
    label ? { data: { title: label } } : {},
  );
}
