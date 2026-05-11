import clsx from 'clsx';
import * as v from 'valibot';
import {
  ColClass,
  createEnable,
  createGroup,
  ResetSchema,
  RowClass,
} from '../common/create-group';
import { Node_EDGE_DEFINE } from '../common/edge';
import { MarkerType } from '@xyflow/react';
import { STYLE_LAYOUT_DEFINE } from '../common/style';
import { NodeLayoutDefine } from '../common/layout';
import { actions, formConfig, setComponent } from '@piying/view-angular-core';
import { map } from 'rxjs';

const EMPTY_ITEM = { label: '---空---', value: '' };
function createTemplateNode(label: string) {
  return v.pipe(
    v.optional(v.string()),
    v.title(label),
    setComponent('select'),
    actions.inputs.set({ options: [] }),
    actions.inputs.patchAsync({
      options: (field) => field.context.templateList$$,
    }),
  );
}
const flowConfigDefine = v.object({
  selectionMode: v.pipe(
    v.optional(v.picklist(['full', 'partial']), 'partial'),
    v.description('按住SHIFT时的选中模式'),
    setComponent('toggle'),
    formConfig({
      transformer: {
        toModel: (value: boolean) => (value ? 'full' : 'partial'),
        toView: (value: string) => value !== 'partial',
      },
    }),
    actions.props.patchAsync({
      title: (field) => {
        return field.form.control!.valueChanges.pipe(
          map((value) => {
            return value !== 'partial' ? '完全选中' : '部分选中';
          }),
        );
      },
    }),
  ),
});
export const OptionsConfigDefine = v.pipe(
  v.object({
    dropGenerate: v.pipe(
      v.optional(v.boolean(), false),
      v.title('拖动生成'),
      v.description(
        '鼠标拖动连接点释放时会自动生成相同元素(如果是连接到其他节点上则不会生成)',
      ),
      actions.wrappers.set(['tooltip', 'label']),
      actions.props.patch({ labelPosition: 'right' }),
    ),
    clickGenerate: v.pipe(
      v.optional(v.boolean(), true),
      v.title('点击生成'),
      v.description('点击连接点会生成与当前节点相同类型的节点'),
      actions.wrappers.set(['tooltip', 'label']),
      actions.props.patch({ labelPosition: 'right' }),
    ),
    nodeTemplatePreset: createGroup(
      [
        v.pipe(
          v.object({
            enable: createEnable('节点模板'),
            __reset: ResetSchema,
          }),
          actions.wrappers.patch([
            { type: 'div', attributes: { class: clsx(RowClass) } },
          ]),
        ),
        v.object({
          value: v.pipe(
            v.optional(
              v.object({
                chat: createTemplateNode('对话节点'),
                card: createTemplateNode('卡片节点'),
                image: createTemplateNode('图片节点'),
                draw: createTemplateNode('绘图节点'),
              }),
            ),
            actions.wrappers.patch([
              { type: 'div', attributes: { class: clsx(ColClass) } },
            ]),
          ),
        }),
      ],
      { cardWrapper: true },
    ),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid gap-2' } },
  ]),
);
/** 表单使用 */
export const GlobalConfigDefine = v.object({
  flow: flowConfigDefine,
  options: OptionsConfigDefine,
});
export const ActionDefaultDefine = v.object({
  flow: v.optional(flowConfigDefine, { selectionMode: 'full' }),
  options: v.optional(OptionsConfigDefine, {
    dropGenerate: false,
    clickGenerate: true,
  }),
  data: v.object({
    edge: v.optional(Node_EDGE_DEFINE, {
      style: { enable: true, value: { strokeWidth: 2 } },
      markerEnd: {
        enable: true,
        value: { type: MarkerType.ArrowClosed, width: 8, height: 8 },
      },
    }),
    style: STYLE_LAYOUT_DEFINE,
    layout: NodeLayoutDefine,
  }),
});

export type GlobalConfigType = v.InferOutput<typeof ActionDefaultDefine>;
