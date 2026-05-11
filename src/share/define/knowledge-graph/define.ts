import * as v from 'valibot';
import { KnowledgeGraphEdgeDefine } from './edge';
import { KnowledgeGraphNodeDefine } from './node';
import { actions, setComponent, valueChange } from '@piying/view-angular-core';

export const KnowledgeGraphCreateDefine = v.intersect([
  v.pipe(
    v.object({
      fileName: v.pipe(
        // v.optional(v.string(), fileName),
        v.string(),
        v.title('文件'),
        setComponent('autocomplete2'),
        actions.class.top('flex-1'),
        actions.props.patchAsync({
          options: (field) => field.context.getFileNameList(),
        }),
      ),
      chunkId: v.pipe(
        v.string(),
        v.title('文件切片'),
        setComponent('picklist'),
        actions.inputs.set({ options: [] }),
        actions.class.top('flex-1'),

        valueChange((fn) => {
          fn({ list: [['#', 'fileName']] }).subscribe(({ list, field }) => {
            if (!list[0]) {
              return;
            }
            field.context.getChunkContentList(list[0]).then((list: any[]) => {
              field.inputs.update((value: any) => {
                return { ...value, options: list };
              });
            });
          });
        }),
      ),
    }),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: 'flex gap-2' } },
    ]),
  ),
  v.pipe(
    v.object({
      nodeList: v.pipe(
        v.optional(v.array(KnowledgeGraphNodeDefine)),
        v.title('实体'),

        setComponent('editable-group'),
        actions.inputs.patchAsync({
          initValue: (field) => () => field.context.nodeInit,
        }),
      ),
      edgeList: v.pipe(
        v.optional(v.array(KnowledgeGraphEdgeDefine)),
        v.title('联系'),
        setComponent('editable-group'),
        actions.inputs.patchAsync({
          initValue: (field) => () => field.context.edgeInit,
        }),
      ),
    }),
    v.check((result) => {
      return !!result.nodeList?.length || !!result.edgeList?.length;
    }),
  ),
]);

export type KnowledgeGraphItemType = v.InferOutput<
  typeof KnowledgeGraphCreateDefine
>;
