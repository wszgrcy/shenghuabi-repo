import * as v from 'valibot';
import {
  ChunkSizeSchema,
  GroupIndexSchema,
  NameSchema,
  GraphRagFormOptionsDefine,
  DictOptionsDefine,
  CreateGraphRagOptionsDefine,
} from '../knowledge/define';
import {
  KnowledgeItemDefine,
  KnowledgeTypeDefine,
} from '../knowledge/working-knowledge';
import { EmbeddingFormDefine } from '../embedding/define';
import { EmbeddingTemplateObjectDefine } from './embeding-template';
import { actions, valueChange } from '@piying/view-angular-core';
/** 表单用 */
export const CreateKnowledgeFormDefine = v.intersect([
  v.object({
    name: NameSchema,
  }),
  v.pipe(
    v.object({
      graphIndex: GroupIndexSchema,
      chunkSize: v.pipe(
        ChunkSizeSchema,
        valueChange((fn) =>
          fn({ list: [['#', 'graphIndex']] }).subscribe(({ list, field }) => {
            field.form.control!.updateValue(list[0] ? 1000 : 100);
          }),
        ),
      ),
    }),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: 'flex gap-2 items-center' } },
    ]),
  ),
  GraphRagFormOptionsDefine,
]);

export const CreateKnowledgeParseDefine = v.object({
  name: NameSchema,
  graphIndex: GroupIndexSchema,
  chunkSize: v.pipe(ChunkSizeSchema),
  ...v.partial(CreateGraphRagOptionsDefine).entries,
  // 通用部分
  embeddingTemplate: EmbeddingTemplateObjectDefine,
});

export type CreateKnowledgeType = v.InferOutput<
  typeof CreateKnowledgeFormDefine
>;
export type CreateKnowledgeWithType = v.InferOutput<
  typeof CreateKnowledgeFormDefine
> & { type: 'knowledge' | 'article' };
/** 包含知识库和字典 */
export const FullKnowledgeCreateParseDefine = v.pipe(
  v.intersect([
    v.object({
      type: KnowledgeTypeDefine,
    }),
    CreateKnowledgeParseDefine,
    v.object({
      embedding: EmbeddingFormDefine,
    }),
    // 字典需要
    v.pipe(
      v.object({
        options: v.optional(DictOptionsDefine),
      }),
    ),
  ]),
  v.transform((item) => {
    // 不够优雅,应该在表单上就处理的
    if (!item.graphIndex) {
      delete item.embeddingTemplate.edge;
      delete item.embeddingTemplate.node;
    }
    return v.parse(KnowledgeItemDefine, {
      ...item,
      collectionList: [
        {
          embedding: item.embedding,
          chunkSize: item.chunkSize,
          collectionName: item.name,
          embeddingTemplate: item.embeddingTemplate,
        },
      ],
      activateCollection: item.name,
    });
  }),
);
/**
 * 1.表单,带默认值;符合条件时显示
 * 2.解析,不带默认值,为可选
 * 3.创建后解析,带默认值
 */
