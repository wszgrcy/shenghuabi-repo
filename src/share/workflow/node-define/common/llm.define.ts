import {
  asVirtualGroup,
  actions,
  setComponent,
} from '@piying/view-angular-core';
import { asColumn, condition } from '@share/valibot';
import * as v from 'valibot';
export function llmModelConfig(item?: { label: string }) {
  return v.pipe(
    v.intersect([
      v.pipe(
        v.intersect([
          v.pipe(
            v.object({
              name: v.pipe(
                v.optional(v.string()),
                v.title('预定义模型配置'),
                setComponent('select'),
                actions.inputs.set({ options: [] }),
                actions.inputs.patchAsync({
                  options: (field) => field.context!.getModelList(),
                }),
              ),
              model: v.pipe(v.optional(v.string()), v.title('模型')),
              configuration: v.optional(
                v.object({
                  baseURL: v.pipe(v.optional(v.string()), v.title('地址')),
                }),
              ),
            }),
            asColumn(),
          ),
        ]),
        v.title(item?.label ?? '对话模型'),
        condition({
          environments: ['display', 'config'],
          actions: [asVirtualGroup()],
        }),
      ),
    ]),
    condition({
      environments: ['display', 'config'],
      actions: [asVirtualGroup()],
    }),
    setComponent('accordion'),
  );
}

export type ModelInputConfig = v.InferOutput<ReturnType<typeof llmModelConfig>>;
