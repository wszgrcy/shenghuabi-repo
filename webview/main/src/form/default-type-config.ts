import { RwFAC } from '@cyia/component/group';

import { FieldGlobalConfig as FieldGlobalConfig1 } from '@fe/piying/define';
const ArrayRepeatConfig = {
  type: RwFAC,
};
// export const DefaultFormTypes = {
//   'span-input': SpanInputConfig,
//   string: SpanInputConfig,
//   input: InputConfig,
//   number: NumberConfig,
//   slider: { type: SliderFCC },
//   'map-toggle': MapToggleConfig,

//   boolean: CheckboxConfig,
//   checkbox: CheckboxConfig,
//   textarea: TextareaConfig,
//   'tab-group': TabGroupConfig,
//   'color-picker': ColorPickerConfig,
//   'styled-style': StyledSelectConfig,
//   button: ButtonConfig,
//   'button-input': ButtonInputConfig,
//   label: LabelConfig,
//   'chip-input-list': ChipInputListConfig,
//   'tree-select': TreeSelectConfig,
//   'array-repeat': ArrayRepeatConfig,
//   accordion: AccordionGroupConfig,
//   'file-input': FileInputConfig,
//   'autocomplete-select': AutoCompleteSelectConfig,

//   select: SelectConfig,
//   picklist: SelectConfig,
//   array: ArrayRepeatConfig,
//   tuple: { type: PiyingViewGroup },

//   object: {
//     type: PiyingViewGroup,
//   },
//   strict_object: {
//     type: PiyingViewGroup,
//   },
//   loose_object: {
//     type: PiyingViewGroup,
//   },
//   intersect: {
//     type: PiyingViewGroup,
//   },
//   'intersect-group': {
//     type: PiyingViewGroup,
//   },
//   'prompt-list': {
//     type: () =>
//       import('./control/prompt-list/component').then(
//         ({ PromptListFCC }) => PromptListFCC,
//       ),
//   },
//   'readonly-value': {
//     type: ReadonlyValueFCC,
//   },
//   'reset-button': ResetButtonConfig,
//   'number-input': NumberInputConfig,
//   'search-group': {
//     type: SearchFGC,
//   },
//   'icon-label': {
//     type: () =>
//       import('@fe/component/icon-label/component').then(
//         ({ IconLabelNFCC }) => IconLabelNFCC,
//       ),
//   },
//   'radio-control': {
//     type: () => import('@cyia/component/core').then(({ RadioFCC }) => RadioFCC),
//   },
//   'llama-model-config': {
//     type: () =>
//       import('@fe/component/chip-list/component').then(
//         ({ LlamaModelConfigFCC }) => LlamaModelConfigFCC,
//       ),
//   },
//   'box-picker': BoxPickerboxConfig,
//   'shadow-picker': ShadowPickerboxConfig,
//   'chip-array': ChipArrayConfig,
//   'node-template-apply': NodeTemplateConfig,
//   empty: {
//     type: EmptyNFCC,
//   },
//   'icon-checkbox': {
//     type: () =>
//       import('@cyia/component/core').then(
//         ({ IconCheckboxFCC }) => IconCheckboxFCC,
//       ),
//   },
//   // 'icon-button': IconButtonConfig,
//   'card-group': {
//     type: CardFGC,
//   },
//   'card-array': {
//     type: CardFAC,
//   },
//   'rest-chip-group': {
//     type: RestChipFGC,
//   },
//   'label-chip-array': {
//     type: LabelChipFAC,
//   },
//   'radio-group': {
//     type: RadioFGC,
//   },
// } as PiViewConfig['types'];

// export const Wrappers = {
//   : {
//     type: MatFormFieldWrapper,
//   },
//   tooltip: {
//     type: TooltipWrapper,
//   },
//   card: WrapperCardConfig,
//   label: {
//     type: LabelWrapper,
//   },
//   'form-field-reset-suffix': {
//     type: FormFieldResetSuffixWrapper,
//   },
//   'alert-valid': {
//     type: AlertValidWrapper,
//   },
//   divider: {
//     type: CyiaDividerWrapper,
//   },
// };
export const FieldGlobalConfig = FieldGlobalConfig1;
export const DefaultFormTypes = FieldGlobalConfig1.types;
export const Wrappers = FieldGlobalConfig1.wrappers;
