import * as v from 'valibot';
export const ComponentDefine = v.object({
  type: v.literal('yaml-textarea'),
  inputs: v.object({}),
  outputs: v.object({}),
});
