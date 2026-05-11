import * as v from 'valibot';
import { createDefine } from './create';
const EMPTY_OBJECT = v.object({});
const FunctionDefine = v.pipe(
  v.function(),
  v.args(v.tuple([])),
  v.returns(v.any()),
);

export const StringDefine = createDefine('string', EMPTY_OBJECT, ['tooltip']);
export const NumberDefine = createDefine('number', EMPTY_OBJECT, ['tooltip']);

export const CheckboxDefine = createDefine('checkbox', EMPTY_OBJECT, [
  'tooltip',
]);

export const ButtonInputDefine = createDefine(
  'button-input',
  v.object({
    disablePlaceholderShow: v.optional(v.boolean()),
    placeholder: v.optional(v.boolean()),
    icon: v.string(),
    color: v.optional(v.picklist(['primary', 'accent', 'warn'])),
    allowClear: v.optional(v.boolean()),
    clicked: FunctionDefine,
  }),
  ['tooltip'],
);

export const ArrayRepeatDefine = createDefine(
  'array-repeat',
  v.object({
    defaultLength: v.optional(v.number()),
    initPrefix: v.optional(
      v.pipe(
        v.function(),
        v.args(v.tuple([v.optional(v.number())])),
        v.returns(v.any()),
      ),
    ),
    label: v.optional(v.string()),
    minLength: v.optional(v.number()),
  }),
  ['tooltip'],
);
export const FileInputDefine = createDefine(
  'file-input',
  v.object({
    mode: v.optional(
      v.picklist(['vscode', 'file', 'card', 'custom', 'default']),
    ),
    /** default使用 */
    label: v.optional(v.string()),

    placeholder: v.optional(v.string()),
    /** vscode使用 */
    filterType: v.optional(v.string()),
    /** file使用 */
    filters: v.optional(v.record(v.string(), v.any())),
    /** file使用 */
    icon: v.optional(v.string()),
    /** file使用 */
    multi: v.optional(v.boolean()),
  }),
  ['tooltip'],
);
const SelectOptionDefine = v.object({
  label: v.string(),
  value: v.string(),
  description: v.optional(v.string()),
});
export const PicklistDefine = createDefine(
  'picklist',
  v.object({
    options: v.array(SelectOptionDefine),
    filterWith: v.optional(
      v.pipe(
        v.function(),
        v.args(v.tuple([v.string(), SelectOptionDefine])),
        v.returns(v.any()),
      ),
    ),
    enableSearch: v.optional(v.boolean()),
    maxCount: v.optional(v.number()),
    label: v.optional(v.string()),
    mode: v.optional(v.picklist(['local', 'remote'])),
    remoteFilter: v.optional(
      v.pipe(
        v.function(),
        v.args(v.tuple([v.string()])),
        v.returnsAsync(v.pipe(v.array(SelectOptionDefine))),
      ),
    ),
  }),
  ['tooltip'],
);
export const ChipInputListDefine = createDefine(
  'chip-input-list',
  v.object({
    disableInput: v.optional(v.boolean()),
    disableDelete: v.optional(v.boolean()),
    editable: v.optional(v.boolean()),
    autocompletion: v.optional(v.boolean()),
    addOnBlur: v.optional(v.boolean()),
    inputRow: v.optional(v.boolean()),
    placeholder: v.optional(v.string()),
    getCompletionList: v.optional(
      v.pipe(
        v.function(),
        v.args(v.tuple([v.string()])),
        v.returnsAsync(v.pipe(v.any())),
      ),
    ),
  }),
  ['tooltip'],
);

export const AccordionDefine = createDefine('accordion', EMPTY_OBJECT, [
  'tooltip',
]);
export const AllComponentDefine = v.variant('type', [
  StringDefine,
  NumberDefine,
  CheckboxDefine,
  ButtonInputDefine,
  ArrayRepeatDefine,
  FileInputDefine,
  PicklistDefine,
  ChipInputListDefine,
  AccordionDefine,
]);

export type PluginComponentType = v.InferOutput<typeof AllComponentDefine>;
