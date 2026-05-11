import { asControl, actions, setComponent } from '@piying/view-angular-core';
import * as v from 'valibot';
export const KnowledgeGraphEdgeDefine = v.pipe(
  v.object({
    source: v.pipe(
      v.string(),
      v.title('来源'),
      setComponent('autocomplete2'),
      actions.props.patch({ allowCustom: true }),
      actions.props.patchAsync({
        options: (field) => field.context.nodeList,
      }),
      actions.class.top('col-span-4'),
    ),
    target: v.pipe(
      v.string(),
      v.title('目标'),
      setComponent('autocomplete2'),
      actions.props.patch({ allowCustom: true }),
      actions.props.patchAsync({
        options: (field) => field.context.nodeList,
      }),
      actions.class.top('col-span-4'),
    ),
    description: v.pipe(
      v.string(),
      v.title('描述'),
      actions.class.top('col-span-8'),
    ),
    keywords: v.pipe(
      v.pipe(
        v.array(v.string()),
        setComponent('chip-input-list'),
        actions.inputs.set({ addOnBlur: true }),
        actions.class.top('col-span-6'),
        asControl(),
      ),
      v.title('关键词'),
    ),
    strength: v.pipe(
      v.optional(v.number(), 5),
      v.title('强度'),
      actions.class.top('col-span-2'),
    ),
  }),

  actions.wrappers.patch([
    {
      type: 'div',
      attributes: { class: 'grid grid-cols-8 gap-2 items-center' },
    },
  ]),
);
export type KnowledgeGraphEdgeType = v.InferOutput<
  typeof KnowledgeGraphEdgeDefine
>;
