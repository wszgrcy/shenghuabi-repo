import * as v from 'valibot';
export const HandleDefine = v.object({
  label: v.string(),
  value: v.string(),
});
export const InputHandleDefine = v.object({
  ...HandleDefine.entries,
  inputType: v.optional(v.string()),
  optional: v.optional(v.boolean()),
});
export const IconSet = v.pipe(
  v.object({
    /** codicon: https://microsoft.github.io/vscode-codicons/dist/codicon.html
     *
     * 默认: https://marella.github.io/material-icons/demo/
     */
    fontIcon: v.string(),
    /** 可为 codicon / 默认不填 */
    fontSet: v.optional(v.string()),
  }),
  v.transform((item) => {
    if (item.fontSet === 'codicon') {
      return {
        ...item,
        fontIcon: `codicon-${item.fontIcon}`,
      };
    }
    return item;
  }),
);
export const IconStr = v.pipe(
  v.string(),
  v.transform((item) => {
    return {
      fontIcon: item,
      fontSet: undefined,
    };
  }),
);
export const NodeDefine = v.object({
  type: v.string(),
  label: v.optional(v.string()),
  /**  */
  icon: v.optional(v.union([IconStr, IconSet])),
  color: v.optional(v.picklist(['primary', 'accent', 'warn'])),
  help: v.optional(v.string()),
  inputs: v.optional(v.array(v.array(InputHandleDefine))),
  outputs: v.optional(v.array(v.array(HandleDefine))),
  disableHead: v.optional(v.boolean(), false),
  disableConnect: v.optional(v.boolean(), false),
  /** 出口表示分支 */
  nodeMode: v.optional(v.picklist(['condition', 'default'])),
});

export type WorkflowNodeConfigType = v.InferInput<typeof NodeDefine>;
export type WorkflowNodeConfigOutputType = v.InferOutput<typeof NodeDefine>;
