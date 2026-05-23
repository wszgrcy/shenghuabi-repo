import * as v from 'valibot';
import { actions, asControl, setComponent } from '@piying/view-angular-core';
export const FILE_NODE_DEFINE = v.object({
  splitPages: v.pipe(
    v.optional(v.boolean(), false),
    v.title('分割页面'),
    v.description(
      '部分类型文件存在多页数据，是否将数据合并为一个文本\n选中会返回一个数组',
    ),

    actions.wrappers.set([
      { type: 'div', attributes: { class: '!flex-none' } },
      'tooltip',
      'label',
    ]),
  ),
  alwaysArray: v.pipe(
    v.optional(v.boolean(), false),
    v.title('数组'),
    v.description(
      '(废弃,推荐使用出口)选中时返回一个文件数组即使只有一个文件；不选中时只在多个文件的时候返回文件数组',
    ),

    actions.wrappers.set([
      { type: 'div', attributes: { class: '!flex-none' } },
      'tooltip',
      'label',
    ]),
  ),
  value: v.pipe(
    v.optional(v.array(v.string()), []),

    v.minLength(1),
    v.title('文件'),
    asControl(),
    setComponent('file-input'),
    actions.inputs.set({ mode: 'file' }),
  ),
});
