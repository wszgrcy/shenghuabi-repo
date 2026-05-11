import * as v from 'valibot';
import { map } from 'rxjs';
import { actions, disableWhen, hideWhen } from '@piying/view-angular-core';

/** 新的表单配置 */

type GroupType = { enable: boolean; value: string };
export function createTemplateDefine(
  groupMetaList: v.BaseMetadata<GroupType>[] = [],
  valueMetaList: v.BaseMetadata<string>[] = [],
) {
  return v.pipe(
    v.object({
      enable: v.pipe(v.optional(v.boolean(), false)),
      value: v.pipe(
        v.optional(v.string()),
        disableWhen<string>({
          listen: (fn) => {
            return fn({
              list: [['..', 'enable']],
            }).pipe(map(({ list }) => !list[0]));
          },
        }),

        actions.class.top<string>('flex-1'),
        ...valueMetaList,
      ),
    }),

    actions.wrappers.patch<GroupType>([
      { type: 'div', attributes: { class: 'flex gap-2 items-center' } },
    ]),

    ...groupMetaList,
  );
}
export const EmbeddingTemplateList = v.pipe(
  v.object({
    entry: createTemplateDefine(
      [],
      [
        v.title('切片词条嵌入模板'),
        // componentDefine({
        //   inputs: {
        //     tooltip: ENTRY_HELP_LIST.join('\n'),
        //     tooltipType: 'tooltip',
        //   },
        // }),
      ],
    ),
    node: createTemplateDefine(
      [
        hideWhen({
          listen: (fn) => {
            return fn({
              list: [['#', 'graphIndex']],
            }).pipe(map(({ list }) => !list[0]));
          },
        }),
      ],
      [
        v.title('实体词条嵌入模板'),
        // componentDefine({
        //   inputs: {
        //     tooltip: NODE_HELP_LIST.join('\n'),
        //     tooltipType: 'tooltip',
        //   },
        // }),
      ],
    ),
    edge: createTemplateDefine(
      [
        hideWhen({
          listen: (fn) => {
            return fn({
              list: [['#', 'graphIndex']],
            }).pipe(map(({ list }) => !list[0]));
          },
        }),
      ],
      [
        v.title('联系词条嵌入模板'),
        // componentDefine({
        //   inputs: {
        //     tooltip: EDGE_HELP_LIST.join('\n'),
        //     tooltipType: 'tooltip',
        //   },
        // }),
      ],
    ),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid gap-2' } },
  ]),
);
