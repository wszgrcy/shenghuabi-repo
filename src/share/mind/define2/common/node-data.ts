import * as v from 'valibot';
import { STYLE_LAYOUT_DEFINE } from './style';
import { NodeLayoutDefine } from './layout';
import { Node_EDGE_DEFINE } from './edge';
import { NodeFoldDefine } from './fold';
import { NodeConfigDefine } from './config';
export const RectSize = v.object({
  width: v.number(),
  height: v.number(),
});
export const transform = v.object({
  resizable: v.optional(v.boolean(), true),
  display: v.optional(v.boolean(), false),
});

export const positionAbsolute = v.optional(
  v.object({
    x: v.number(),
    y: v.number(),
  }),
);
export const CommonPrivate = v.optional(v.object({ positionAbsolute }));

export const TitleDefine = v.optional(v.string());

export const HandleItemDefine = v.object({
  id: v.string(),
  label: v.string(),
  value: v.string(),
});
export const MindHandleDefine = v.object({
  input: v.array(v.array(HandleItemDefine)),
  //   output: v.array(v.array(HandleItemDefine)),
});

export const NodeCommonDefine = v.object({
  style: v.optional(STYLE_LAYOUT_DEFINE),
  layout: v.optional(NodeLayoutDefine),
  edge: v.optional(Node_EDGE_DEFINE),
  fold: v.optional(NodeFoldDefine),
  __private: v.optional(CommonPrivate),
  minSize: v.optional(RectSize),
  transform: v.optional(transform),
  config: v.optional(NodeConfigDefine),
});

export type NodeCommonType = v.InferOutput<typeof NodeCommonDefine>;
