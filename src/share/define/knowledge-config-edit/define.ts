import { asColumn } from '@share/valibot';
import * as v from 'valibot';
import { EmbeddingTemplateObjectDefine } from '../knowledge-create/embeding-template';
import {
  actions,
  asControl,
  asVirtualGroup,
  disableWhen,
  setComponent,
} from '@piying/view-angular-core';
import { ChunkSizeSchema, GroupIndexSchema } from '../knowledge/define';
import { EmbeddingFormDefine } from '../embedding/define';
import { map } from 'rxjs';

export const KnowledgeEditFormDefine = v.pipe(
  v.object({
    graphIndex: v.pipe(GroupIndexSchema, setComponent('')),
    nameSuffix: v.pipe(
      v.string(),
      v.title('集合名-后缀'),
      v.description('如果重名会自动加后缀'),
      actions.class.top('flex-1'),
    ),
    collection: v.pipe(
      v.intersect([
        v.pipe(
          v.object({
            chunkSize: v.pipe(
              ChunkSizeSchema,
              disableWhen({
                listen: (fn) => {
                  return fn({
                    list: [['#', 'graphIndex']],
                  }).pipe(map(({ list }) => list[0]));
                },
              }),
            ),
          }),
          asVirtualGroup(),
          actions.wrappers.patch([
            { type: 'div', attributes: { class: 'flex items-center gap-2' } },
          ]),
        ),
        v.pipe(
          v.intersect([
            v.object({
              embedding: EmbeddingFormDefine,
            }),
            v.object({
              embeddingTemplate: EmbeddingTemplateObjectDefine,
            }),
          ]),
          asVirtualGroup(),
          actions.wrappers.patch([
            { type: 'div', attributes: { class: 'grid gap-2' } },
          ]),
        ),
      ]),
      asVirtualGroup(),
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'grid gap-2' } },
      ]),
    ),
    activateCollection: v.pipe(v.string(), setComponent('')),
    collectionList: v.pipe(v.array(v.any()), asControl(), setComponent('')),
  }),
  asColumn(),
);
const type = v.optional(v.picklist(['dict', 'knowledge']), 'knowledge');
// todo 需要手动配置,三合一,输入/编辑
export const KnowledgeConfigItem = v.intersect([
  KnowledgeEditFormDefine,
  v.object({ name: v.string(), type }),
]);
export type KnowledgeEditType = v.InferOutput<typeof KnowledgeEditFormDefine>;
