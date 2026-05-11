import * as v from 'valibot';
import { actions, setComponent } from '@piying/view-angular-core';
export const KnowledgeGraphNodeDefine = v.pipe(
  v.object({
    type: v.pipe(
      v.string(),
      setComponent('select2'),
      v.title('类型'),
      actions.inputs.patch({
        changeClose: true,
      }),
      actions.props.patch({ options: [], maxListCount: 25 }),
      actions.class.top('flex-1'),
      actions.props.patchAsync({
        options: (field) => field.context.getEntityTypeList(),
      }),
    ),
    name: v.pipe(
      v.string(),
      v.title('实体名'),
      setComponent('autocomplete2'),
      actions.props.patch({ allowCustom: true }),
      actions.props.patchAsync({
        options: (field) => field.context.nodeList,
      }),
      actions.class.top('flex-1'),
    ),
    description: v.pipe(
      v.string(),
      v.title('描述'),
      actions.class.top('flex-1'),
    ),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'flex gap-2 items-center' } },
  ]),
);

export type KnowledgeGraphNodeType = v.InferOutput<
  typeof KnowledgeGraphNodeDefine
>;
