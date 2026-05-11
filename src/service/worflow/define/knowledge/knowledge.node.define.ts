import * as v from 'valibot';
import {
  actions,
  asControl,
  condition,
  layout,
  setComponent,
  valueChange,
} from '@piying/view-angular-core';
import { selectOptions } from '@share/valibot';
import { INLINE_Template2 } from '../../../../share/workflow/node-define/common/inline-template.define';
const sourceList = [
  { label: '文章', value: 'article' },
  { label: '知识库', value: 'knowledge' },
  { label: '字典', value: 'dict' },
] as const;
export const KNOWLEDGE_NODE_DEFINE = v.looseObject({
  data: v.pipe(
    v.looseObject({
      value: v.pipe(
        v.array(v.string()),
        asControl(),
        v.title('文件'),
        setComponent('tree-select'),
        actions.inputs.set({ treeConfig: undefined }),
        condition({
          environments: ['display'],
          actions: [asControl(), setComponent('readonly-value')],
        }),
      ),
      config: v.object({
        source: v.pipe(
          v.picklist(sourceList.map((item) => item.value)),
          selectOptions(sourceList),
          v.title('来源'),
          valueChange((fn) => {
            fn({ list: [undefined] }).subscribe(({ list, field }) => {
              const source = list[0];
              if (!source) {
                return;
              }
              const valueField = field.get(['..', 'value']);
              field.context.getContextTree(source).then((result: any) => {
                valueField?.inputs.update((value: any) => {
                  return { ...value, treeConfig: result };
                });
              });
            });
          }),
          layout({ keyPath: ['..', '..'] }),
          condition({
            environments: ['display'],
            actions: [
              selectOptions(sourceList),
              setComponent('readonly-value'),
            ],
          }),
        ),
        template: v.pipe(INLINE_Template2, layout({ keyPath: ['..', '..'] })),
        question: v.pipe(
          v.string(),
          v.title('问题'),
          valueChange((fn) => {
            fn({
              list: [undefined],
            }).subscribe(({ list, field }) => {
              if (typeof list[0] === 'string') {
                field.context.parseTemplate(list[0]).then((result: any) => {
                  if (!result) {
                    return;
                  }
                  field.context.changeHandleData(field, 'input', 2, result);
                });
              }
            });
          }),
          layout({ keyPath: ['..', '..'] }),
          condition({
            environments: ['display'],
            actions: [setComponent('readonly-value')],
          }),
        ),
        limit: v.pipe(
          v.optional(v.number(), 10),
          v.title('查询数量'),
          v.minValue(1),
          layout({ keyPath: ['..', '..'] }),
        ),
      }),
    }),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: 'grid gap-2' } },
    ]),
  ),
});
