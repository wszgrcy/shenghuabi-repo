import * as v from 'valibot';
import { actions, setComponent } from '@piying/view-angular-core';

export const KnowledgeQueryDefine = v.object({
  query: v.pipe(v.string(), v.title('搜索')),
  range: v.pipe(
    v.object({
      knowledge: v.pipe(
        v.optional(v.boolean(), false),
        v.title('知识库'),
        actions.props.patch({
          labelPosition: 'right',
        }),
      ),
      dict: v.pipe(
        v.optional(v.boolean(), true),
        v.title('字典'),
        actions.props.patch({
          labelPosition: 'right',
        }),
      ),
    }),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: 'flex gap-2' } },
    ]),
  ),
  source: v.pipe(v.optional(v.literal('codeAction')), setComponent('')),
});
export type KnowledgeQueryType = v.InferOutput<typeof KnowledgeQueryDefine>;
export type KnowledgeQueryOptions = KnowledgeQueryType;
