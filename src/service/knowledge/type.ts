import * as v from 'valibot';
import { KnowledgeItemDefine } from '../../share/define/knowledge/working-knowledge';
export const ExportKnowledgeMetadataDefine = v.object({
  snapshot: v.pipe(
    v.optional(
      v.array(
        v.object({
          collection: v.string(),
          filePath: v.string(),
          checksum: v.optional(v.string()),
        }),
      ),
      [],
    ),
    v.minLength(1),
  ),
  data: v.object({
    filePath: v.optional(v.string()),
  }),
});
export type ExportKnowledgeMetadata = v.InferOutput<
  typeof ExportKnowledgeMetadataDefine
>;

export const ExportKnowledgeConfigDefine = v.object({
  metadata: ExportKnowledgeMetadataDefine,
  options: KnowledgeItemDefine,
  version: v.number(),
});

export type ExportKnowledgeConfig = v.InferOutput<
  typeof ExportKnowledgeConfigDefine
>;
