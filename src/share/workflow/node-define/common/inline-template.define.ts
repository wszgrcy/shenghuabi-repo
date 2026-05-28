import { actions, disableWhen } from '@piying/view-angular-core';
import { TextareaTemplateDefine } from '@shenghuabi/workflow';
// keep for other uses
import { map } from 'rxjs';
import * as v from 'valibot';

export const INLINE_Template = v.pipe(
  v.object({
    enable: v.optional(v.boolean(), true),
    // 经用条件
    value: v.pipe(
      v.optional(TextareaTemplateDefine, [
        [
          {
            type: 'variable',
            item: { label: 'NODE.description', value: ['NODE.description'] },
          },
        ],
      ]),
      v.title('模板'),
      v.description('允许使用变量:{{NODE.xxx}}(参考节点帮助)'),
      actions.wrappers.set(['tooltip', 'label']),
      actions.class.top('flex-1'),

      disableWhen({
        listen: (fn) => {
          return fn({
            list: [['..', 'enable']],
          }).pipe(map(({ list }) => !list[0]));
        },
      }),
    ),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'flex gap-2' } },
  ]),
);
