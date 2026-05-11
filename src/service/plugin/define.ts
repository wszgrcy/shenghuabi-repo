import * as v from 'valibot';
import { NodeDefine } from '../../share/workflow/node-define/component-define';
import { Provider } from 'static-injector';
import type { NodeRunnerBase } from '@shenghuabi/workflow';
import { TTSPluginDefine } from '@shenghuabi/python-addon';
const PluginNodeDefine = v.object({
  client: v.string(),
  runner: v.custom<typeof NodeRunnerBase>((item) => typeof item === 'function'),
  config: NodeDefine,
});
export type PluginNodeType = v.InferOutput<typeof PluginNodeDefine>;
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type CustomProvider = Exclude<Provider, Function | Array<any>>;
const ProviderDefine = v.array(
  v.custom<CustomProvider>(
    (item) =>
      !!item &&
      typeof item === 'object' &&
      'provide' in item &&
      ('useClass' in item || 'useValue' in item),
  ),
);
export type ProviderType = v.InferOutput<typeof ProviderDefine>;
export type PluginNodeConfigType = v.InferOutput<typeof PluginNodeDefine>;
export const ManifestDefine = v.object({
  providers: v.optional(
    v.object({
      priority: v.optional(v.number(), 0),
      root: v.optional(ProviderDefine),
      knowledge: v.optional(ProviderDefine),
    }),
  ),
  workflow: v.optional(
    v.object({
      priority: v.optional(v.number(), 0),
      node: v.array(PluginNodeDefine),
      context: v.optional(v.pipe(v.record(v.string(), v.function()))),
    }),
  ),
  tts: v.optional(TTSPluginDefine),
});
export type ManifestType = v.InferOutput<typeof ManifestDefine>;
export type ManifestReturnType = v.InferInput<typeof ManifestDefine>;
