import * as v from 'valibot';
import {
  actions,
  asControl,
  asVirtualGroup,
  condition,
  setComponent,
  valueChange,
} from '@piying/view-angular-core';

import { INLINE_Template } from '../../../../share/workflow/node-define/common/inline-template.define';
export const GRAPH_QUERY_NODE_DEFINE = v.looseObject({
  data: v.looseObject({
    config: v.pipe(
      v.intersect([
        v.pipe(
          v.object({
            // 选项引用
            name: v.pipe(
              v.string(),
              v.title('知识库'),
              v.description('需要创建的知识库启用图索引'),
              setComponent('picklist'),
              actions.wrappers.set(['tooltip', 'label']),
              actions.inputs.set({
                options: [],
              }),
              actions.inputs.patchAsync({
                options: (field) => field.context!.selectRagKnowledgeList(),
              }),
              condition({
                environments: ['display'],
                actions: [setComponent('readonly-value')],
              }),
            ),
            question: v.pipe(
              v.optional(v.string()),
              v.title('问题'),
              valueChange((fn) => {
                fn({ list: [undefined] }).subscribe(({ list, field }) => {
                  if (typeof list[0] !== 'string') {
                    return;
                  }
                  field.context
                    .parseTemplate(list[0] ?? '')
                    .then((value: any) => {
                      if (!value) {
                        return;
                      }
                      field.context.changeHandleData(field, 'input', 1, value);
                    });
                });
              }),
              condition({
                environments: ['display'],
                actions: [setComponent('readonly-value')],
              }),
            ),
            list: v.pipe(
              v.optional(v.array(v.string())),
              asControl(),
              v.title('选择'),
              setComponent('chip-input-list'),
              actions.inputs.set({
                autocompletion: true,
                getCompletionList: undefined,
              }),
              actions.inputs.patchAsync({
                getCompletionList: (field) => {
                  return async (str: string) => {
                    const graphName = field.get(['..', 'name'])!.form.control!
                      .value;
                    if (!graphName) {
                      return [];
                    }
                    return field.context.selectGraphNode(str, graphName);
                  };
                },
              }),
              condition({
                environments: ['display'],
                actions: [setComponent('readonly-value')],
              }),
            ),
            template: INLINE_Template,
          }),
          actions.wrappers.patch([
            { type: 'div', attributes: { class: 'grid gap-2' } },
          ]),
          v.forward(
            v.partialCheck(
              [['list'], ['question']],
              (input) => {
                return !!input.list || !!input.question;
              },
              '提问和选择必须存在一个',
            ),
            ['question'],
          ),
        ),

        v.pipe(
          v.object({
            nodeLimit: v.pipe(
              v.optional(v.number(), 10),
              v.title('实体数量'),
              v.minValue(1),
            ),
            nodeSizeLimit: v.pipe(
              v.optional(v.number(), 20),
              v.title('每实体词条数量'),
              v.minValue(1),
            ),
          }),

          actions.wrappers.patch([
            { type: 'div', attributes: { class: 'grid grid-cols-2 gap-2' } },
          ]),
        ),
        v.object({
          score: v.pipe(
            v.optional(v.number(), 0.6),
            v.title('相似度'),
            v.minValue(0),
            v.maxValue(1),
          ),
        }),
      ]),
      asVirtualGroup(),
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'grid gap-2' } },
      ]),
    ),
  }),
});
