import { selectOptions } from '@share/valibot';
import * as v from 'valibot';
import {
  actions,
  hideWhen,
  setComponent,
  valueChange,
} from '@piying/view-angular-core';
import { map } from 'rxjs';
import { TextareaTemplateDefine } from '@shenghuabi/workflow';
const typeList = [
  { label: '卡片', value: 'card' },
  { label: '文本组', value: 'text' },
  // { label: '自定义', value: 'custom' },
] as const;

export const TEMPLATE_NODE_DEFINE = v.pipe(
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
          v.optional(TextareaTemplateDefine, [
            [
              {
                type: 'variable',
                item: { label: '问题', value: ['标题'], type: 'custom' },
              },
            ],
          ]),
          hideWhen({
            disabled: true,
            listen: (fn) => {
              return fn({
                list: [['..', 'type']],
              }).pipe(map(({ list }) => list[0] !== 'card'));
            },
          }),
        ),
        content: v.pipe(
          v.optional(TextareaTemplateDefine, [
            [
              {
                type: 'variable',
                item: { label: '内容', value: ['内容'], type: 'custom' },
              },
            ],
          ]),
        ),
      }),
    ),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid gap-2' } },
  ]),
);
