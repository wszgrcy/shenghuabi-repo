import * as v from 'valibot';
import { actions, asControl, setComponent } from '@piying/view-angular-core';

import { TextareaTemplateDefine } from '@shenghuabi/workflow/share';

export const KNOWLEDGE_NODE_DEFINE = v.object({
  question: v.pipe(
    v.optional(TextareaTemplateDefine, [
      [
        {
          type: 'variable',
          item: { label: '问题', value: ['问题'], type: 'custom' },
        },
      ],
    ]),
    v.title('问题'),
  ),
  limit: v.pipe(v.optional(v.number(), 10), v.title('查询数量'), v.minValue(1)),
  value: v.pipe(
    v.string(),
    asControl(),
    v.title('知识库名字'),
    setComponent('tree-select'),
    actions.inputs.patchAsync({
      treeConfig: (field) => {
        return field.context.getContextTree();
      },
    }),
    v.metadata({
      toolJsonSchema: {
        needKnowledge: true,
      },
    }),
  ),
});
