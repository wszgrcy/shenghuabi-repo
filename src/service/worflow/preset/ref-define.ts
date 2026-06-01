import { actions, setComponent } from '@piying/view-angular-core';
import * as v from 'valibot';
export const TextareaTemplateDefine = v.pipe(
  v.any(),
  setComponent('textarea-template'),
  actions.class.top('nodrag'),
);
export const RefDefine = v.pipe(
  v.any(),
  setComponent('div-control'),
  actions.wrappers.patch(['use-ref']),
);
