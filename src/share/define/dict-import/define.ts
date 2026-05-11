import clsx from 'clsx';
import * as v from 'valibot';
import { noKey, RowClass, RowGrid2Class } from '../../mind';
import type { PiResolvedViewFieldConfig } from '@piying/view-angular';
import { EmbeddingTemplateEntryDefine } from '../knowledge-create/embeding-template';
import {
  actions,
  asVirtualGroup,
  hideWhen,
  layout,
  setComponent,
  valueChange,
} from '@piying/view-angular-core';
import { ChunkSizeSchema, DictOptionsDefine } from '../knowledge/define';
import { map } from 'rxjs';
export const DictImportDefine = v.intersect([
  v.object({
    data: v.pipe(
      v.intersect([
        v.pipe(
          v.object({
            filePath: v.pipe(
              v.string(),
              setComponent('button-input'),
              actions.inputs.patch({
                placeholder: '[请选择字典]',
                shape: 'circle',
                style: 'ghost',
                content: { icon: { fontIcon: 'attach_file' } },
              }),
              actions.inputs.patchAsync({
                clicked: (field) => () => {
                  return field.context.selectFile();
                },
              }),
              actions.class.top('w-full'),
            ),
            type: v.pipe(
              v.picklist(['mdict', 'yaml', 'stardict', 'dsl']),
              valueChange((fn) => {
                fn({ list: [['#', 'data', 'filePath']] }).subscribe(
                  ({ list, field }) => {
                    const value = list[0];
                    if (!value) {
                      return;
                    }
                    if (value.endsWith('.mdx')) {
                      field.form.control?.updateValue(`mdict`);
                    } else if (
                      value.endsWith('.yml') ||
                      value.endsWith('.yaml')
                    ) {
                      field.form.control?.updateValue(`yaml`);
                    } else if (value.endsWith('.dsl')) {
                      field.form.control?.updateValue(`dsl`);
                    } else {
                      field.form.control?.updateValue(`stardict`);
                    }
                  },
                );
              }),
              setComponent(''),
              //             componentDefine({ type: undefined }),
            ),
          }),
          layout({ priority: 0, keyPath: ['#'] }),
        ),
        v.pipe(
          v.object({
            regCode: v.pipe(
              v.optional(v.string()),
              v.title('注册码'),
              actions.props.set({
                placeholder: '如果存在则填写',
                appearance: 'outline',
              }),
            ),
            userId: v.pipe(
              v.optional(v.string()),
              v.title('用户ID'),
              actions.props.set({
                placeholder: '如果存在则填写',
                appearance: 'outline',
              }),
            ),
          }),
          hideWhen({
            listen: (fn) => {
              return fn({
                list: [['#', 'data', 'type']],
              }).pipe(map(({ list }) => list[0] !== 'mdict'));
            },
          }),
          actions.wrappers.patch([
            { type: 'div', attributes: { class: clsx(RowGrid2Class) } },
          ]),
          layout({ priority: 1.1, keyPath: ['#'] }),
        ),
      ]),
      asVirtualGroup(),
    ),
  }),
  v.pipe(
    v.object({
      name: v.pipe(
        v.string(),
        v.title('字典名'),
        actions.props.set({
          placeholder: '默认与导入文件相同',
        }),
        actions.class.top('flex-1'),

        valueChange((fn) => {
          fn({ list: [['#', 'data', 'filePath']] }).subscribe(
            ({ list, field }) => {
              const filePath = list[0];
              if (!filePath) {
                return;
              }
              const data = field.get(['#', 'data'])!;
              field.context
                .getDictFileName(data.form.control!.value)
                .then((a: any) => {
                  field.form.control!.updateValue(a);
                });
            },
          );
        }),
      ),
      __getName: v.pipe(
        noKey,
        v.description('从字典中获取名称'),
        setComponent('button'),
        actions.wrappers.set(['tooltip']),
        actions.inputs.patchAsync({
          clicked: (field: PiResolvedViewFieldConfig) => () => {
            const nameField = field.get(['..', '..', 'data'])!;
            field.context
              .getDictFileName(nameField.form.control!.value)
              .then((a: any) => {
                field.get(['..', 'name'])!.form.control!.updateValue(a);
              });
          },
        }),
      ),
    }),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: clsx(RowClass) } },
    ]),
    layout({ priority: 1, keyPath: ['#'] }),
  ),

  v.pipe(
    v.object({
      chunkSize: v.pipe(v.optional(ChunkSizeSchema, 200)),
    }),
    layout({ priority: 2, keyPath: ['#'] }),
  ),
  v.pipe(
    v.object({
      options: DictOptionsDefine,
    }),
  ),
  v.object({
    embeddingTemplate: v.pipe(
      v.object({
        entry: EmbeddingTemplateEntryDefine,
      }),
      layout({ priority: 4, keyPath: ['#'] }),
    ),
  }),
]);

export type DictImportConfigType = v.InferOutput<typeof DictImportDefine>;
export type DictImportConfigWithType = v.InferOutput<
  typeof DictImportDefine
> & { type: 'dict' };
