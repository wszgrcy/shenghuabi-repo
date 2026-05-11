import { actions, typedComponent } from '@piying/view-angular';
import { PresetDefine } from '@piying-lib/angular-daisyui/preset';
import {
  ChipInputListFCC,
  ShadowPickerFCC,
  StyledSelectFCC,
} from '@cyia/component/core';
import {
  AutocompleteFCC,
  CheckboxFCC,
  InputNumberFCC,
} from '@piying-lib/angular-daisyui/field-control';
import { computed } from '@angular/core';
import { IconLabelNFCC } from '@fe/component/icon-label/component';
import { LlamaModelConfigFCC } from '@fe/component/chip-list/component';
import { ChipFAC, LabelChipFAC, RestChipFGC } from '@cyia/component/group';
import { FileInputFCC } from '@fe/form/control/file-input/component';
import { Select2 } from './preset/select2';
import { CardFGC } from '@fe/component/group/card-group/component';
import { setComponent } from '@piying/view-angular-core';
import { ResetButtonNFCC } from '@fe/form/un-control/reset-button/component';
import { CardWrapper } from '@cyia/component/wrapper';
import { BoxPickerFCC } from '@fe/component/box-picker/component';
import { NodeTemplateApplyFCC } from '@fe/form/control/node-template/component';
import { PromptListFCC } from '@fe/form/control/prompt-list/component';
import { TreeSelectFCC } from '@fe/form/control/tree-select/component';
import { AutoComplete2 } from './preset/autocomplete2';
const optionsMap = actions.inputs.mapAsync((field) => {
  const options$$ = computed(() => field.props()['options']);
  return (data) => {
    return {
      ...data,
      options: data.options ?? options$$(),
    };
  };
});
export const safeDefine = typedComponent({
  ...PresetDefine,
  types: {
    ...PresetDefine.types,
    'intersect-group': PresetDefine.types.object,
    'chip-input-list': { type: ChipInputListFCC },
    boolean: {
      type: CheckboxFCC,
      actions: [actions.wrappers.set(['label'])],
    },
    picklist: {
      type: PresetDefine.types.picklist.type,
      actions: [...PresetDefine.types.picklist.actions, optionsMap],
    },
    'styled-style': {
      type: StyledSelectFCC,
      actions: [actions.wrappers.set(['label']), optionsMap],
    },
    'icon-label': {
      type: IconLabelNFCC,
    },
    'llama-model-config': {
      type: LlamaModelConfigFCC,
    },
    'label-chip-array': {
      type: LabelChipFAC,
    },
    'file-input': {
      type: FileInputFCC,
    },
    'rest-chip-group': {
      type: RestChipFGC,
    },
    select2: {
      actions: [...Select2, actions.wrappers.set(['label'])],
    },
    autocomplete2: {
      actions: [...AutoComplete2, actions.wrappers.set(['label'])],
    },
    tuple: PresetDefine.types.object,
    intersect: PresetDefine.types.object,
    'card-group': {
      type: CardFGC,
    },
    loose_object: PresetDefine.types.object,
    'color-picker': {
      actions: [
        setComponent(AutocompleteFCC),
        actions.inputs.patch({
          type: 'color',
          allowCustom: true,
          options: [
            '#ff1300',
            '#EC7878',
            '#9C27B0',
            '#673AB7',
            '#3F51B5',
            '#0070FF',
            '#03A9F4',
            '#00BCD4',
            '#4CAF50',
            '#8BC34A',
            '#CDDC39',
            '#FFE500',
            '#FFBF00',
            '#FF9800',
            '#795548',
            '#9E9E9E',
            '#5A5A5A',
            '#FFFFFF',
          ],
        }),
      ],
    },
    'reset-button': {
      type: ResetButtonNFCC,
    },
    'box-picker': {
      type: BoxPickerFCC,
    },
    'number-input': {
      type: InputNumberFCC,
      actions: [actions.wrappers.set(['label'])],
    },
    'chip-array': {
      type: ChipFAC,
    },
    'node-template-apply': {
      type: NodeTemplateApplyFCC,
    },
    tabs: {
      type: PresetDefine.types.tabs.type,
      actions: [
        actions.inputs.patch({
          tabContentClass: 'bg-base-100 border-base-300 p-2',
        }),
      ],
    },
    'shadow-picker': {
      type: ShadowPickerFCC,
    },
    'prompt-list': {
      type: PromptListFCC,
    },
    'tree-select': { type: TreeSelectFCC },
  },
  wrappers: {
    ...PresetDefine.wrappers,
    card: {
      type: CardWrapper,
    },
  },
});
export const FieldGlobalConfig = safeDefine.define;
