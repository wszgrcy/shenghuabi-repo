import * as v from 'valibot';
import {
  condition,
  valueChange,
  setComponent,
  actions,
} from '@piying/view-angular-core';
import { debounceTime } from 'rxjs';
export const CONDITION_NODE_DEFINE = v.looseObject({
  data: v.looseObject({
    config: v.object({
      conditions: v.pipe(
        v.optional(
          v.array(
            v.pipe(
              v.object({
                value: v.pipe(
                  v.optional(v.string(), ''),
                  v.minLength(1),
                  v.title('判断表达式'),
                  condition({
                    environments: ['display'],
                    actions: [setComponent('string')],
                  }),
                ),
              }),
              condition({
                environments: ['display'],
                actions: [setComponent('object')],
              }),
            ),
          ),
          [{ value: '' }],
        ),
        v.minLength(1),
        v.title('条件'),

        condition({
          environments: ['display', 'default'],
          actions: [
            setComponent('editable-group'),
            actions.inputs.set({ minLength: 1 }),
            valueChange((fn) => {
              fn({ list: [undefined] })
                .pipe(debounceTime(200))
                .subscribe(({ list: [value], field }) => {
                  if (!Array.isArray(value)) {
                    return;
                  }
                  field.context.changeHandleData(
                    field,
                    'output',
                    0,
                    (value as any[]).map((item, index) => {
                      return { label: item.value, value: `${index}` };
                    }),
                  );
                  field.context
                    .parseTemplate(
                      (value as any[])
                        .map((item) => item.value ?? '')
                        .join('\n'),
                      'js',
                    )
                    .then((value: any) => {
                      if (!value) {
                        return;
                      }
                      field.context.changeHandleData(field, 'input', 1, value);
                    });
                });
            }),
          ],
        }),
      ),
    }),
  }),
});
