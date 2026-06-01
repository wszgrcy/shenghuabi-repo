import * as v from 'valibot';

import { actions, asControl, setComponent } from '@piying/view-angular-core';

export const WORKFLOW_EXEC_DEFINE = v.pipe(
  v.object({
    name: v.pipe(
      v.string(),
      asControl(),
      v.title('工作流名'),
      setComponent('button-input'),
      actions.inputs.patch({
        placeholder: '[请选择工作流]',
        shape: 'circle',
        style: 'ghost',
        content: { icon: { fontIcon: 'polyline' } },
        clicked: () => {},
      }),
      actions.inputs.patchAsync({
        clicked: (field) => {
          return async () => {
            const result = await field.context.selectWorkflow({});
            if (!result) {
              return;
            }
            const list = await field.context.getWorkflowInputList(result);
            // field.context.changeHandleData(field, 'input', 1, list);
            return result;
          };
        },
      }),
    ),
  }),

  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid auto-rows-auto gap-2' } },
  ]),
);
