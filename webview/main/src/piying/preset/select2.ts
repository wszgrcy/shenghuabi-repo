import { computed } from '@angular/core';
import {
  PickerRefFCC,
  PickerRefService,
} from '@piying-lib/angular-daisyui/extension';
import { actions, NFCSchema, setComponent } from '@piying/view-angular-core';
// import { safeDefine } from '../define';
import * as v from 'valibot';
export const Select2 = [
  setComponent(PickerRefFCC),
  actions.inputs.patch({
    changeClose: false,
  }),
  actions.inputs.patch({
    trigger: v.pipe(
      NFCSchema,
      setComponent('common-data'),
      actions.inputs.patchAsync({
        content: (field) => {
          let serivce = field.injector.get(PickerRefService);
          let valueMapFn = computed(() => {
            return serivce.rootField$$().props()['valueMapFn'];
          });
          return computed(() => {
            let fn = valueMapFn();
            const pickerValue = field.context['pickerValue']();
            if (fn) {
              return fn(pickerValue);
            }
            return typeof pickerValue === 'string'
              ? pickerValue
              : (pickerValue?.join(',') ?? '[empty]');
          });
        },
      }),
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'select' } },
      ]),
    ),
    content: v.pipe(
      v.any(),
      setComponent('option-list'),
      actions.wrappers.set(['local-filter']),
      actions.props.patchAsync({
        options: (field) => {
          return computed(() => {
            return field.context['parentProps']()['options'];
          });
        },
      }),
      actions.inputs.patchAsync({
        multiple: (field) => {
          return computed(() => {
            return field.context['parentProps']()['multiple'] ?? false;
          });
        },
        maxListCount: (field) => {
          return computed(() => {
            return field.context['parentProps']()['maxListCount'];
          });
        },
      }),
      actions.class.bottom('bg-white rounded-box shadow'),
    ),
  }),
] as const;
