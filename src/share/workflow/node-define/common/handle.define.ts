import { condition } from '@share/valibot';
import * as v from 'valibot';
import { renderConfig, setComponent } from '@piying/view-angular-core';
const HiddenAction = condition<any>({
  environments: ['display', 'default'],
  actions: [setComponent(''), renderConfig({ hidden: true })],
});
const AnyHiddenList = v.pipe(
  v.array(v.pipe(v.optional(v.any()), HiddenAction)),
  setComponent(''),
  renderConfig({ hidden: true }),
);
export const HandleDataDefine = v.pipe(
  v.optional(
    v.object({
      output: AnyHiddenList,
      input: AnyHiddenList,
    }),
  ),
  HiddenAction,
);
