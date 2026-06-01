import { actions, asControl } from '@piying/view-angular-core';
import * as v from 'valibot';

export const ARRAY_MERGE_NODE_DEFINE = v.object({
  list: v.pipe(
    v.array(v.any()),
    asControl(),
    // setComponent('div'),
    actions.wrappers.patch(['label', 'use-ref']),
    v.title('列表'),
  ),
  level: v.pipe(v.optional(v.number(), 999), v.title('扁平级别')),
});
