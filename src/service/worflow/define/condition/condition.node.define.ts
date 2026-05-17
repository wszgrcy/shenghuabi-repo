import * as v from 'valibot';
import {
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
                ),
              }),
            ),
          ),
          [{ value: '' }],
        ),
        v.minLength(1),
        v.title('条件'),

        setComponent('editable-group'),
        actions.inputs.set({ minLength: 1 }),
  
      ),
    }),
  }),
});
