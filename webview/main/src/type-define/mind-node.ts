import * as v from 'valibot';
/**
 * 增加一个节点类型.
 * 边的默认样式
 * 批量布局是否可行?因为目前如果导入的话没法分清主次
 */
const LEGACY_CARD_ITEM = v.pipe(
  v.object({
    title: v.string(),
    content: v.pipe(
      v.record(v.string(), v.any()),
      v.transform((item) => {
        return Object.entries(item)
          .flatMap(([key, value]) => {
            return [key ? `## ${key}` : undefined, value].filter(Boolean);
          })
          .join('\n\n');
      }),
    ),
  }),
  v.transform((item) => {
    return {
      ...item,
      relations: [],
      type: 'card' as const,
      contentPath: undefined,
    };
  }),
);

/** 过时卡片 */
const LEGACY_CARD_ITEM_PARSER = v.pipe(
  LEGACY_CARD_ITEM,
  v.transform((item) => {
    return { list: [item] };
  }),
);
/** 过时卡片列表 */
const LEGACY_CARD_LIST = v.pipe(
  v.array(LEGACY_CARD_ITEM),
  v.transform((list) => {
    return { list };
  }),
);
const CARD_ITEM = v.pipe(
  v.object({
    type: v.optional(v.literal('card'), 'card'),
    /** 因为卡片生成可能是空标题党那种 */
    title: v.optional(v.string(), ''),
    content: v.optional(v.string()),
    contentPath: v.optional(v.string()),
    relations: v.pipe(
      v.optional(
        v.array(
          v.pipe(
            v.object({
              to: v.optional(v.string()),
              from: v.optional(v.string()),
              label: v.optional(v.string()),
            }),
            v.check((item) => {
              return !!item.to || !!item.from;
            }, `from/to必须存在一个`),
          ),
        ),
        [],
      ),
    ),
  }),
  v.check((item) => {
    return !!item.content || !!item.contentPath;
  }, `content/contentPath必须存在一个`),
);

/** 纯文本内容 */
const TEXT_ITEM = v.pipe(
  v.object({
    type: v.literal('text'),
    content: v.optional(v.string()),
    contentPath: v.optional(v.string()),
  }),
  v.check((item) => {
    return !!item.content || !!item.contentPath;
  }, `content/contentPath必须存在一个`),
);
const IMPORT_ITEM = v.union([CARD_ITEM, TEXT_ITEM]);
export type CARD_IMPORT_TYPE = v.InferOutput<typeof CARD_ITEM>;
export type TEXT_IMPORT_TYPE = v.InferOutput<typeof TEXT_ITEM>;
/** 工作流模板卡片 */
const CARD_ITEM_PARSER = v.pipe(
  IMPORT_ITEM,
  v.transform((item) => {
    return {
      list: [item],
    };
  }),
);
/** 工作流模板卡片列表 */
const CARD_LIST = v.pipe(
  v.array(IMPORT_ITEM),
  v.transform((list) => {
    return {
      list,
    };
  }),
);
/** 真正导出标准卡片列表 */
export const EXPORT_BATCH_CARD_METADATA = v.object({
  list: v.array(IMPORT_ITEM),
});
export function parseBuildNode(input: any) {
  if (Array.isArray(input)) {
    const result1 = v.safeParse(CARD_LIST, input);
    if (result1.success) {
      return result1.output;
    }
    const result2 = v.safeParse(LEGACY_CARD_LIST, input);
    if (result2.success) {
      return result2.output;
    }
  } else {
    if ('list' in input) {
      const result1 = v.safeParse(EXPORT_BATCH_CARD_METADATA, input);
      if (result1.success) {
        return result1.output;
      }
    }
    const result2 = v.safeParse(CARD_ITEM_PARSER, input);
    if (result2.success) {
      return result2.output;
    }
    const result3 = v.safeParse(LEGACY_CARD_ITEM_PARSER, input);
    if (result3.success) {
      return result3.output;
    }
  }
  return undefined;
}
export type BuildNodeData = NonNullable<ReturnType<typeof parseBuildNode>>;
