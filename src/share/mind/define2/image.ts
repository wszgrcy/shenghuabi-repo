import * as v from 'valibot';

import { NodeCommonDefine, transform } from './common/node-data';

/** 是否需要更准确 */
export const ImageValueDefine = v.optional(
  v.object({
    kind: v.literal('image'),
    type: v.string(),
    src: v.string(),
  }),
);
// 默认值

export const ImageDefaultDefine = v.object({
  transform: v.optional(transform),
  value: ImageValueDefine,
});

//定义

export const ImageDataDefine = v.object({
  ...NodeCommonDefine.entries,
  ...ImageDefaultDefine.entries,
});

export type ImageDataType = v.InferOutput<typeof ImageDataDefine>;
