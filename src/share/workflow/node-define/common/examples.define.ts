import { condition, actions, renderConfig } from '@piying/view-angular-core';
import { asColumn } from '@share/valibot';
import * as v from 'valibot';

export const EXAMPLES_DEFINE = v.pipe(
  v.optional(
    v.array(
      v.pipe(
        v.object({
          input: v.pipe(
            v.object({
              format: v.pipe(
                v.optional(v.boolean(), false),
                v.description(
                  '选中后会尝试使用yaml解析为对象,再序列化为对应的响应类型',
                ),
                actions.wrappers.patch(['tooltip']),
              ),
              value: v.pipe(
                v.string(),
                v.title('问题'),
                actions.class.top('flex-1'),
              ),
            }),
            actions.wrappers.patch([
              { type: 'div', attributes: { class: 'flex gap-2 items-center' } },
            ]),
          ),

          output: v.pipe(
            v.object({
              format: v.pipe(
                v.optional(v.boolean(), false),
                v.description('是否需要格式化'),
                actions.wrappers.patch(['tooltip']),
              ),
              value: v.pipe(
                v.string(),
                v.title('回答'),
                actions.class.top('flex-1'),
              ),
            }),
            actions.wrappers.patch([
              { type: 'div', attributes: { class: 'flex gap-2 items-center' } },
            ]),
          ),
        }),
        asColumn(),
      ),
    ),
    [],
  ),
  v.title('用例'),
  v.description('回答问题之前,会参考定义的用例格式进行回复,用于规范回答'),
  condition({
    environments: ['display'],
    actions: [
      renderConfig({
        hidden: true,
      }),
    ],
  }),
);
