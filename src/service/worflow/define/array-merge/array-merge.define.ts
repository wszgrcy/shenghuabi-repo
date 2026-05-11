import { condition, setComponent } from '@piying/view-angular-core';
import * as v from 'valibot';

export const ARRAY_MERGE_NODE_DEFINE = v.looseObject({
  data: v.looseObject({
    config: v.object({
      level: v.pipe(
        v.optional(v.number(), 999),
        v.title('扁平级别'),
        condition({
          environments: ['display'],
          actions: [setComponent('readonly-value')],
        }),
      ),
    }),
  }),
});
