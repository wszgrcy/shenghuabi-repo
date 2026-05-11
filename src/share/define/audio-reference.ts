import * as v from 'valibot';
import {
  condition,
  mergeHooks,
  setComponent,
  actions,
} from '@piying/view-angular-core';
import { deepEqual } from 'fast-equals';
import { BehaviorSubject } from 'rxjs';

export const Reference = v.pipe(
  v.custom((a) => !!a),
  setComponent('picklist'),
  v.title('使用配音'),
  actions.inputs.patchAsync({
    compareWith: () => deepEqual,
    options: (field) => {
      const subject = new BehaviorSubject<any[]>([]);
      field.context['getActionList']().then((list: any[]) => {
        subject.next(list);
        if (!field.form.control?.value) {
          field.form.control?.updateValue(list[0].value);
        }
      });
      return subject;
    },
  }),
  condition({
    environments: ['display'],
    actions: [
      mergeHooks({
        allFieldsResolved: (field) => {
          setTimeout(() => {
            field.context['getActionList']().then((list: any[]) => {
              if (!field.form.control?.value) {
                field.form.control?.updateValue(list[0]);
              }
            });
          }, 0);
        },
      }),
    ],
  }),
);
