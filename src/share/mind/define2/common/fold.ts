import * as v from 'valibot';

export const NodeFoldDefine = v.object({
  left: v.optional(v.boolean()),
  top: v.optional(v.boolean()),
  right: v.optional(v.boolean()),
  bottom: v.optional(v.boolean()),
});
