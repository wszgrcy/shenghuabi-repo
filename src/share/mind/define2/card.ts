import clsx from 'clsx';
import * as v from 'valibot';

import { asControl, actions, setComponent } from '@piying/view-angular-core';
import {
  ColClass,
  createEnable,
  createGroup,
  ResetSchema,
  RowClass,
} from './common/create-group';
import { ColorSchema } from './common/color';
import {
  CommonPrivate,
  NodeCommonDefine,
  RectSize,
  TitleDefine,
  transform,
} from './common/node-data';
export const EditorDecorationTypeDefine = v.object({
  color: v.pipe(
    ColorSchema,
    v.title('字体颜色'),

    actions.wrappers.set(['label']),
  ),
  backgroundColor: v.pipe(
    ColorSchema,
    v.title('字体背景颜色'),
    actions.wrappers.set(['label']),
  ),
  opacity: v.pipe(v.optional(v.number(), 1), v.title('透明度')),
});
export const CardEditorDefine = v.pipe(
  v.object({
    word: createGroup([v.object({ enable: createEnable('允许重命名') })]),
    decorationRender: createGroup([
      v.pipe(
        v.object({ enable: createEnable('高亮'), __reset: ResetSchema }),
        actions.wrappers.patch([
          { type: 'div', attributes: { class: clsx(RowClass) } },
        ]),
      ),
      v.object({
        value: v.pipe(
          v.optional(EditorDecorationTypeDefine),
          actions.wrappers.patch([
            { type: 'div', attributes: { class: clsx(ColClass) } },
          ]),
        ),
      }),
    ]),
    completion: createGroup([
      v.pipe(
        v.object({ enable: createEnable('补全'), __reset: ResetSchema }),
        actions.wrappers.patch([
          { type: 'div', attributes: { class: clsx(RowClass) } },
        ]),
      ),
      v.object({
        value: v.optional(
          v.object({
            list: v.pipe(
              v.optional(v.array(v.string()), []),
              asControl(),
              v.description('当输入定义词语之一时,会触发补全,默认为输入标题'),
              setComponent('chip-input-list'),
              actions.wrappers.set(['tooltip', 'label']),
              actions.inputs.set({
                addOnBlur: true,
                editable: true,
              }),
            ),
            pinyin: v.pipe(
              v.optional(v.boolean(), false),
              v.title('拼音补全'),
              v.description('使用拼音作为补全之一'),
              actions.wrappers.set(['tooltip', 'label']),
            ),
          }),
        ),
      }),
    ]),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: clsx(ColClass) } },
  ]),
);

export const CardStatusDefine = v.object({
  /** 卡片状态切换,
   *
   */
  open: v.optional(v.picklist(['full', 'title', 'content']), 'full'),
  /** 是否处于只读状态 */
  readonly: v.optional(v.boolean(), false),
  /** 显示优先还是操作优先
   */
  editorInteractionMode: v.optional(
    v.picklist(['full', 'displayFirst']),
    'full',
  ),
});
export const CardPrivate = v.intersect([
  CommonPrivate,
  v.object({
    fullSize: v.optional(RectSize),
  }),
]);
export const CardValueDefine = v.object({
  /** 状态恢复,lexicl SerializedEditorState<SerializedLexicalNode> */
  editorState: v.custom<any>(Boolean),
  /** 导入时使用 */
  markdownRoot: v.optional(v.string()),
  /** 导入时使用 */
  markdown: v.optional(v.string()),
  /** 保存导出时使用,用于给编辑器显示 */
  html: v.optional(v.string()),
});

// 默认值
export const CardMinSizeDefault = v.optional(RectSize, {
  width: 350,
  height: 300,
});
/** 全量卡片默认值 */
export const FullCardDefaultDefine = v.object({
  transform: transform,
  minSize: CardMinSizeDefault,
  editor: v.optional(CardEditorDefine, {
    word: { enable: true },
    completion: { enable: true, value: { pinyin: true } },
    decorationRender: { enable: true },
  }),
});
/** 纯文本默认值 */
export const ContentCardDefaultDefine = v.object({
  transform: transform,
  status: v.optional(CardStatusDefine, {
    open: 'content',
    editorInteractionMode: 'displayFirst',
  }),
});
// 定义
export const CardDataDefine = v.object({
  ...NodeCommonDefine.entries,
  ...FullCardDefaultDefine.entries,
  value: CardValueDefine,
  title: TitleDefine,
  status: CardStatusDefine,
  __private: CardPrivate,
});

export type CardDataType = v.InferOutput<typeof CardDataDefine>;
/** 编辑器解析时使用 */
export const EditorDecorationTypeTransformDefine = v.object({
  ...EditorDecorationTypeDefine.entries,
  opacity: v.pipe(
    EditorDecorationTypeDefine.entries.opacity,
    v.transform((value) => `${value}`),
  ),
});
