import {
  actions,
  asControl,
  condition,
  hideWhen,
  layout,
  setAlias,
  setComponent,
} from '@piying/view-angular-core';
import { selectOptions } from '@share/valibot';
import { map } from 'rxjs';
import * as v from 'valibot';
export const ModeList = [
  { label: '插入', value: 'insert', description: '只按照文件数量分组' },
  {
    label: '分片统计',
    value: 'chunk',
    description: '按照文件数量,并且每个文件会按照指定长度切分',
  },
] as const;

export const ARTICLE_NODE_DEFINE = v.looseObject({
  data: v.pipe(
    v.looseObject({
      value: v.pipe(
        v.optional(v.array(v.string()), []),
        v.title('文章'),
        v.minLength(1),
        asControl(),
        setComponent('tree-select'),
        actions.inputs.set({ treeConfig: undefined }),
        layout({ keyPath: ['..'] }),
        actions.inputs.patchAsync({
          treeConfig: (field) => field.context.getContextTree('article'),
        }),
        condition({
          environments: ['display'],
          actions: [asControl(), setComponent('readonly-value')],
        }),
      ),
      config: v.pipe(
        v.object({
          mode: v.pipe(
            v.optional(
              v.picklist(ModeList.map((item) => item.value)),
              'insert',
            ),
            v.title('模式'),
            selectOptions(ModeList),
            layout({ keyPath: ['..', '..'] }),
            setAlias('mode'),
            condition({
              environments: ['display'],
              actions: [
                selectOptions(ModeList),
                setComponent('readonly-value'),
              ],
            }),
          ),
          step: v.pipe(
            v.optional(v.number(), 0),
            v.title('文章数'),
            v.description('按照数量将所有文章切分为多段,0为不切分'),

            actions.wrappers.set(['tooltip', 'label']),
            layout({ keyPath: ['..', '..'] }),
            condition({
              environments: ['display'],
              actions: [setComponent('readonly-value')],
            }),
          ),
          chunkSize: v.pipe(
            v.optional(v.number(), 1000),
            v.title('分隔长度'),
            v.description('知识库中每条内容保存的长度'),
            actions.wrappers.set(['tooltip', 'label']),
            hideWhen({
              disabled: true,
              listen: (fn) => {
                return fn({
                  list: [['@mode']],
                }).pipe(map(({ list }) => list[0] !== 'chunk'));
              },
            }),
            layout({ keyPath: ['..', '..'] }),
            condition({
              environments: ['display'],
              actions: [setComponent('readonly-value')],
            }),
          ),
        }),
      ),
    }),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: 'grid gap-2' } },
    ]),
  ),
});
