import { selectOptions } from '@share/valibot';
import * as v from 'valibot';
import {
  actions,
  hideWhen,
  layout,
  setComponent,
  valueChange,
} from '@piying/view-angular-core';
import { map } from 'rxjs';
const typeList = [
  { label: '卡片', value: 'card' },
  { label: '文本组', value: 'text' },
  // { label: '自定义', value: 'custom' },
] as const;

export const TEMPLATE_NODE_DEFINE = v.looseObject({
  data: v.looseObject({
    config: v.pipe(
      v.object({
        type: v.pipe(
          v.optional(v.picklist(typeList.map((item) => item.value)), 'card'),
          selectOptions(typeList),
        ),
        define: v.pipe(
          v.object({
            type: v.pipe(
              v.optional(v.string(), 'card'),
              setComponent(''),
              valueChange((fn) => {
                fn({ list: [['..', 'type']] }).subscribe(({ list, field }) => {
                  if (list[0] !== field.form.control?.value) {
                    field.form.control!.updateValue(list[0]);
                  }
                });
              }),
            ),
            // 按条件隐藏
            title: v.pipe(
              v.optional(v.string(), '{{标题}}'),
              hideWhen({
                disabled: true,
                listen: (fn) => {
                  return fn({
                    list: [['..', 'type']],
                  }).pipe(map(({ list }) => list[0] !== 'card'));
                },
              }),
              layout({ keyPath: ['..', '..'] }),
            ),
            content: v.pipe(
              v.optional(v.string(), '{{内容}}'),
              layout({ keyPath: ['..', '..'] }),
            ),
          }),
          valueChange((fn) => {
            fn({ list: [undefined] }).subscribe(({ list, field }) => {
              field.context
                .parseTemplate(Object.values(list[0]).filter(Boolean), 'liquid')
                .then((value: any) => {
                  if (!value) {
                    return;
                  }
                  field.context.changeHandleData(field, 'input', 2, value);
                });
            });
          }),
        ),
      }),
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'grid gap-2' } },
      ]),
    ),
  }),
});
