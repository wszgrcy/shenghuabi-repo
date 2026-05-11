import { selectOptions } from '@share/valibot';
import * as v from 'valibot';
import {
  ColClass,
  createEnable,
  createGroup,
  ResetSchema,
  RowClass,
} from './create-group';
import { MarkerType } from '@xyflow/react';
import { ColorSchema } from './color';
import { actions, asVirtualGroup } from '@piying/view-angular-core';
import clsx from 'clsx';
const MarkerTypeOptionsList = [
  { label: '箭头', value: MarkerType.Arrow },
  {
    label: '闭合箭头',
    value: MarkerType.ArrowClosed,
  },
] as const;
export const Node_EDGE_DEFINE = v.pipe(
  v.object({
    style: createGroup([
      v.pipe(
        v.object({
          enable: createEnable('样式'),
          __reset: ResetSchema,
        }),
        actions.wrappers.patch([
          { type: 'div', attributes: { class: clsx(RowClass) } },
        ]),
      ),
      v.object({
        value: v.optional(
          v.pipe(
            v.object({
              stroke: v.pipe(
                ColorSchema,
                v.title('颜色'),
                actions.wrappers.set(['label']),
              ),
              strokeWidth: v.pipe(
                v.optional(v.number(), 2),
                v.title('宽度'),
                actions.class.top('flex-1'),
              ),
            }),
            actions.wrappers.patch([
              { type: 'div', attributes: { class: clsx(RowClass) } },
            ]),
          ),
        ),
      }),
    ]),

    animated: v.pipe(v.optional(v.boolean(), false), v.title('动画')),
    markerEnd: createGroup([
      v.pipe(
        v.object({
          enable: createEnable('箭头'),
          __reset: ResetSchema,
        }),
        actions.wrappers.patch([
          { type: 'div', attributes: { class: clsx(RowClass) } },
        ]),
      ),
      v.object({
        value: v.optional(
          v.pipe(
            v.intersect([
              v.pipe(
                v.object({
                  type: v.pipe(
                    v.optional(
                      v.picklist(MarkerTypeOptionsList.map((a) => a.value)),
                      MarkerTypeOptionsList[0].value,
                    ),
                    selectOptions(MarkerTypeOptionsList),
                    v.title('类型'),
                    actions.class.top('flex-1'),
                  ),
                  color: v.pipe(
                    ColorSchema,
                    v.title('颜色'),
                    actions.wrappers.set(['label']),
                  ),
                }),
                actions.wrappers.patch([
                  { type: 'div', attributes: { class: clsx(RowClass) } },
                ]),
              ),
              v.pipe(
                v.object({
                  width: v.pipe(v.optional(v.number()), v.title('宽度')),
                  height: v.pipe(v.optional(v.number()), v.title('高度')),
                  strokeWidth: v.pipe(v.optional(v.number()), v.title('描边')),
                }),

                actions.wrappers.patch([
                  {
                    type: 'div',
                    attributes: { class: clsx([...ColClass, 'grid-cols-3']) },
                  },
                ]),
              ),
            ]),
            asVirtualGroup(),
            actions.wrappers.patch([
              {
                type: 'div',
                attributes: { class: clsx(ColClass) },
              },
            ]),
          ),
        ),
      }),
    ]),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: clsx(ColClass) } },
  ]),
);

export type NodeEdgeConfigType = v.InferOutput<typeof Node_EDGE_DEFINE>;
