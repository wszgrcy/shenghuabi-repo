import * as v from 'valibot';
import {
  ChunkSizeSchema,
  DictOptionsDefine,
  GroupIndexSchema,
  NameSchema,
  GraphRagOptionsDefine,
} from './define';
import { EmbeddingTemplateObjectDefine } from '../knowledge-create/embeding-template';
import { EmbeddingDefine, EmbeddingSizeSchema } from '../embedding/define';
// todo 图谱的同步数量之类的?参数?
export const CollectionConfig = v.object({
  chunkSize: ChunkSizeSchema,
  embeddingTemplate: EmbeddingTemplateObjectDefine,
  embedding: v.object({
    ...EmbeddingDefine.entries,
    // 每批数量和同步数量
    batchSize: v.optional(v.number(), 50),
    asyncCount: v.optional(v.number(), 10),
    /** 必填,因为如果是transfomers就是自动获取 */
    size: v.nonOptional(EmbeddingSizeSchema),
  }),
  collectionName: v.string(),
});
export type KnowledgeCollectionConfigType = v.InferOutput<
  typeof CollectionConfig
>;
export const KnowledgeTypeDefine = v.optional(
  v.picklist(['dict', 'knowledge', 'article']),
  'knowledge',
);
/** 非表单 */
export const KnowledgeItemDefine = v.intersect([
  v.object({
    name: NameSchema,
    type: KnowledgeTypeDefine,
    options: v.optional(DictOptionsDefine),
    /** 知识库索引 */
    graphIndex: GroupIndexSchema,
    activateCollection: v.string(),
    collectionList: v.pipe(v.array(CollectionConfig)),
  }),
  // 只有图谱才用的上 (普通的只有一个词条模板)
  v.partial(GraphRagOptionsDefine),
]);

export type KnowledgeItemType = v.InferOutput<typeof KnowledgeItemDefine>;

/** 知识库配置文件,就是保存的json文件 */
export const KnowledgeFileDefine = v.object({
  list: v.optional(v.array(KnowledgeItemDefine), []),
  version: v.optional(v.literal(4), 4),
});

export type KnowledgeFileType = v.InferOutput<typeof KnowledgeFileDefine>;
