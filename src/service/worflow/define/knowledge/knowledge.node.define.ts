import * as v from 'valibot';
import {
  actions,
  asControl,
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
export const KNOWLEDGE_NODE_DEFINE = v.object({
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
  ),
  template: v.pipe(INLINE_Template2),
  question: v.pipe(
    v.string(),
    v.title('问题'),
  ),
  limit: v.pipe(
    v.optional(v.number(), 10),
    v.title('查询数量'),
    v.minValue(1),
  ),
  value: v.pipe(
    v.array(v.string()),
    asControl(),
    v.title('文件'),
    setComponent('tree-select'),
    actions.inputs.set({ treeConfig: undefined }),
  ),
});
