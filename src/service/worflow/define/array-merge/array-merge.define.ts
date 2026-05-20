import { actions, asControl, condition, setComponent } from '@piying/view-angular-core';
import * as v from 'valibot';

export const ARRAY_MERGE_NODE_DEFINE = v.object({
  list: v.pipe(
    v.array(v.any()),
    asControl(),
    actions.wrappers.patch(['use-ref']),
  ),
  level: v.pipe(v.optional(v.number(), 999), v.title('扁平级别')),
});
