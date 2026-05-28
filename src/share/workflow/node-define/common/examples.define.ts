import { actions } from '@piying/view-angular-core';
import { asColumn } from '@share/valibot';
import * as v from 'valibot';

export const EXAMPLES_DEFINE = v.pipe(
  v.optional(
    v.array(
      v.pipe(
        v.object({
          input: v.pipe(
            v.object({
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
);
