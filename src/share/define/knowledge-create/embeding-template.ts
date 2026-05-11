import * as v from 'valibot';
import { componentDefine } from '@share/valibot';
import { actions, disableWhen, hideWhen } from '@piying/view-angular-core';
import { map } from 'rxjs';
// export function createCyiaEmbeddingTemplate(
//   config: Partial<CyiaRawFormlyFieldConfig>,
//   valueConfig: Partial<CyiaRawFormlyFieldConfig>,
// ) {
//   return defaultsDeep(config, {
//     renderConfig: {
//       ngClass: 'grid grid-cols-[auto_1fr] items-center',
//     },
//     fieldGroup: [
//       {
//         key: 'enable',
//         type: 'checkbox',
//         wrappers: [],
//         props: {},
//         defaultValue: false,
//       },
//       defaultsDeep(valueConfig, {
//         key: 'value',
//         type: 'textarea',
//         props: {
//           appearance: 'outline',
//           autosize: true,
//         },
//         hooks: {
//           allFieldsResolved: (field) => {
//             formControlObservable(
//               field.get(['..', 'enable'])!.form.control!,
//             ).subscribe((value) => {
//               if (value) {
//                 field.form.control?.enable();
//               } else {
//                 field.form.control?.disable();
//               }
//             });
//           },
//         },
//       } as CyiaRawFormlyFieldConfig),
//     ],
//   } as CyiaRawFormlyFieldConfig) as CyiaRawFormlyFieldConfig;
// }
/** 新的表单配置 */
// export const ENTRY_CONFIG = createCyiaEmbeddingTemplate(
//   {
//     key: ['embeddingTemplate', 'entry'],
//   },
//   {
//     wrappers: [
//       {
//         type: 'tooltip',
//         inputs: {
//           tooltipType: 'tooltip',
//         },
//       },
//       ,
//     ],

//     props: {
//       label: '切片词条嵌入模板',
//       tooltip: ENTRY_HELP_LIST.join('\n'),
//     },
//   },
// );
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
        componentDefine<string>({
          wrappers: ['label'],
        }),
        actions.class.top<string>('flex-1'),
        ...valueMetaList,
      ),
    }),

    actions.wrappers.patch<GroupType>([
      'label',
      { type: 'div', attributes: { class: 'flex gap-2 items-center' } },
    ]),
    // actions.class.component<GroupType>('flex gap-2 items-center'),
    ...groupMetaList,
  );
}
export const EmbeddingTemplateEntryDefine = createTemplateDefine(
  [v.title('切片词条嵌入模板')],
  [
    // componentDefine({
    //   inputs: {
    //     tooltip: ENTRY_HELP_LIST.join('\n'),
    //     tooltipType: 'tooltip',
    //   },
    // }),
  ],
);
export const EmbeddingTemplateObjectDefine = v.pipe(
  v.object({
    entry: v.optional(EmbeddingTemplateEntryDefine),
    // 应该监听graphIndex和enable处理,但是部分代码共用
    node: v.optional(
      createTemplateDefine(
        [
          hideWhen({
            listen: (fn) => {
              return fn({
                list: [['#', 'graphIndex']],
              }).pipe(map(({ list }) => !list[0]));
            },
          }),
          v.title('实体词条嵌入模板'),
        ],
        [
          // componentDefine({
          //   inputs: {
          //     tooltip: NODE_HELP_LIST.join('\n'),
          //     tooltipType: 'tooltip',
          //   },
          // }),
        ],
      ),
    ),
    edge: v.optional(
      createTemplateDefine(
        [
          hideWhen({
            listen: (fn) => {
              return fn({
                list: [['#', 'graphIndex']],
              }).pipe(map(({ list }) => !list[0]));
            },
          }),
          v.title('联系词条嵌入模板'),
        ],
        [
          // componentDefine({
          //   inputs: {
          //     tooltip: EDGE_HELP_LIST.join('\n'),
          //     tooltipType: 'tooltip',
          //   },
          // }),
        ],
      ),
    ),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid gap-2' } },
  ]),
);
