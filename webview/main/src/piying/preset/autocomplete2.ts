import { computed } from '@angular/core';
import {
  PickerRefFCC,
  PickerRefService,
} from '@piying-lib/angular-daisyui/extension';
import { actions } from '@piying/view-angular';
import { setComponent } from '@piying/view-angular-core';
import { filter } from 'rxjs';
import * as v from 'valibot';
export const TriggerButton = v.pipe(v.string(), setComponent('input'));
export const ContentButton = v.pipe(
  v.string(),
  setComponent('option-list'),
  actions.inputs.patch({
    options: [],
  }),
  actions.inputs.patchAsync({
    options: (field) => {
      const service = field.injector.get(PickerRefService);
      return computed(() => {
        return service.rootField$$().props()['options'];
      });
    },
  }),
  actions.hooks.merge({
    allFieldsResolved: (field) => {
      const service = field.injector.get(PickerRefService);
      const triggerField = service.triggerField$$();
      triggerField.form
        .control!.valueChanges.pipe(filter((a) => typeof a === 'string'))
        .subscribe((value) => {
          const options = field.inputs()['options'] as any[];
          const allowCustom = service.rootField$$().props()['allowCustom'];

          field.inputs.update((data) => {
            return {
              ...data,
              options: !value
                ? options
                : options.filter((item) => item.value.includes(value)),
            };
          });
          if (allowCustom) {
            const rootField$$ = service.rootField$$();
            rootField$$.form.control!.updateValue(value);
          }
        });
    },
  }),

  actions.class.bottom('bg-white rounded-box shadow'),
);
export const AutoComplete2 = [
  setComponent(PickerRefFCC),
  actions.inputs.patch({
    trigger: TriggerButton,
    content: ContentButton,
  }),
] as const;
