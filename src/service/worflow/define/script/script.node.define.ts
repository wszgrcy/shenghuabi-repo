import * as v from 'valibot';
import {
  actions,
  asControl,
  valueChange,
  setComponent,
  renderConfig,
} from '@piying/view-angular-core';
export const SCRIPT_NODE_DEFINE = v.pipe(
  v.looseObject({
    input: v.pipe(
      v.optional(v.array(v.string()), []),
      asControl(),
      v.title('输入变量'),
      v.description('指定脚本的输入变量'),
      setComponent('chip-input-list'),
      actions.inputs.set({
        editable: true,
        addOnBlur: true,
        getCompletionList: undefined,
      }),
      actions.wrappers.set(['tooltip', 'label']),
    ),
    output: v.pipe(
      v.optional(v.array(v.string()), []),
      asControl(),
      v.title('输出变量'),
      v.description('指定脚本的出口'),
      setComponent('chip-input-list'),
      actions.inputs.set({
        editable: true,
        addOnBlur: true,
        getCompletionList: undefined,
      }),
      actions.wrappers.set(['tooltip', 'label']),
      valueChange((fn) => {
        fn().subscribe(({ list: [value], field }) => {
          field.context.setOutputHandle(
            0,
            (value as any[]).map((item) => {
              return { label: item, value: item };
            }),
          );
        });
      }),
    ),
    title: v.pipe(v.string(), setComponent('')),
    value: v.pipe(
      v.string(),
      setComponent('button-input'),
      actions.inputs.set({
        disablePlaceholderShow: true,
        shape: 'circle',
        style: 'ghost',
        content: { icon: { fontIcon: 'code' } },
        clicked: () => {},
      }),
      actions.inputs.patchAsync({
        clicked: (field) => () => {
          return field.context.openTsEditor(
            field.get(['#'])?.form.control!.value,
            field,
          );
        },
      }),
    ),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid gap-2' } },
  ]),
);
