import { actions, disableWhen } from '@piying/view-angular-core';
// keep for other uses
import { map } from 'rxjs';
import * as v from 'valibot';

export const INLINE_Template = v.pipe(
  v.object({
    enable: v.optional(v.boolean(), true),
    // 经用条件
    value: v.pipe(
      v.optional(v.string(), '{{NODE.description}}'),
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
export const INLINE_Template2 = v.pipe(
  v.object({
    enable: v.optional(v.boolean(), false),
    // 经用条件
    value: v.pipe(
      v.optional(v.string()),
      v.title('模板'),
      v.description('允许使用变量:{{ENTRY.xxx}}(参考节点帮助)'),
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
    { type: 'div', attributes: { class: 'flex gap-2 items-center' } },
  ]),
);
