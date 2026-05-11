import * as v from 'valibot';
import {
  actions,
  asVirtualGroup,
  layout,
  setComponent,
} from '@piying/view-angular-core';
import { ColorSchema, StyleSchema } from './color';
import { noKey } from './void.schema';

export const DirectionList = [
  { label: '下侧方向', value: 'bottom' },
  { label: '上侧方向', value: 'top' },
  { label: '左侧方向', value: 'left' },
  { label: '右侧方向', value: 'right' },
  { label: '水平方向', value: 'x' },
  { label: '竖直方向', value: 'y' },
  { label: '所有方向', value: 'global' },
] as const;
export const DirectionMap = DirectionList.reduce(
  (obj, item) => {
    (obj as any)[item.value] = item.label;
    return obj;
  },
  {} as ValueToLabel<typeof DirectionList>,
);

type ValueToLabel<T extends readonly { label: string; value: string }[]> = {
  [K in T[number]['value']]: Extract<T[number], { value: K }>['label'];
};
export const BoxDefine = v.pipe(
  v.intersect([
    v.pipe(
      v.object({
        color: ColorSchema,
        style: StyleSchema,
      }),

      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'flex items-center gap-2' } },
      ]),
    ),
    v.object({
      width: v.pipe(
        v.optional(v.number(), 1),
        v.title('宽度'),
        setComponent('number-input'),
        actions.inputs.set({ max: 20 }),
        layout({ keyPath: ['..', '..'] }),
      ),
      radius: v.pipe(
        v.optional(v.number(), 8),
        v.title('倒角'),
        setComponent('number-input'),
        actions.inputs.set({ max: 20 }),
        layout({ keyPath: ['..', '..'] }),
      ),
    }),
  ]),
  asVirtualGroup(),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid gap-2' } },
  ]),
);
export type BoxType = v.InferOutput<typeof BoxDefine>;
export const PickerConfig = v.intersect([
  v.pipe(
    v.object({
      direction: v.pipe(
        v.picklist(DirectionList.map((item) => item.value)),
        setComponent('label'),
        actions.inputs.set({ labelMap: DirectionMap }),
        actions.class.top('flex-1'),
      ),
      __restButton: v.pipe(
        noKey,
        setComponent('reset-button'),
        actions.inputs.set({
          keyPath: ['..', '..', 'data'],
        }),
      ),
    }),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: 'flex gap-2' } },
    ]),
  ),

  v.object({
    data: BoxDefine,
  }),
]);

export type BoxPickerInputType = {
  left: v.InferInput<typeof PickerConfig>['data'];
  right: v.InferInput<typeof PickerConfig>['data'];
  top: v.InferInput<typeof PickerConfig>['data'];
  bottom: v.InferInput<typeof PickerConfig>['data'];
};
export enum Direction {
  top = 'top',
  right = 'right',
  left = 'left',
  bottom = 'bottom',
  x = 'x',
  y = 'y',
  global = 'global',
}
