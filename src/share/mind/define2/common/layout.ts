import clsx from 'clsx';
import { selectOptions } from '@share/valibot';
import * as v from 'valibot';
import { ColClass } from './create-group';
import { noKey } from './void.schema';
import { actions, mergeHooks, setComponent } from '@piying/view-angular-core';
const layoutDirection = [
  { value: 'TB', icon: 'arrow_downward' },
  { value: 'BT', icon: 'arrow_upward' },
  { value: 'LR', icon: 'arrow_forward' },
  { value: 'RL', icon: 'arrow_back' },
] as const;
const AliginOptions = [
  {
    value: '',
    icon: '',
  },
  {
    value: 'UL',
    icon: 'tab',
    style: { transform: 'rotate(270deg)' },
  },
  { value: 'UR', icon: 'tab' },
  {
    value: 'DL',
    icon: 'tab',
    style: { transform: 'rotate(90deg)' },
  },
  {
    value: 'DR',
    icon: 'tab',
    style: { transform: 'rotate(180deg)' },
  },
] as const;
export const NodeLayoutDefine = v.pipe(
  v.object({
    rankdir: v.pipe(
      v.optional(v.picklist(layoutDirection.map((a) => a.value)), 'LR'),
      selectOptions(layoutDirection),
      v.title('布局方向'),
      setComponent('styled-style'),
      actions.wrappers.set(['label']),
    ),
    align: v.pipe(
      v.optional(v.picklist(AliginOptions.map((a) => a.value)), 'UL'),
      selectOptions(AliginOptions),
      v.title('节点对齐'),
      setComponent('styled-style'),
      actions.wrappers.set(['label']),
    ),
    __layoutChildren: v.pipe(
      noKey,
      setComponent('button'),
      actions.inputs.patch({
        // type: 'flat',
        content: '布局子级',
      }),
      actions.inputs.patchAsync({
        clicked: (field) => () => {
          field.context.layoutNode(1);
        },
      }),
      mergeHooks({
        fieldResolved(field) {
          field.context.isGlobal$$.subscribe((isGlobal: any) => {
            field.renderConfig.update((config: any) => {
              return { ...config, hidden: isGlobal };
            });
            field.formConfig.update((value: any) => {
              return isGlobal
                ? { ...value, disabled: true, disabledValue: 'delete' }
                : { ...value, disabled: false, disabledValue: 'delete' };
            });
          });
        },
      }),
    ),
    __layoutDescent: v.pipe(
      noKey,
      setComponent('button'),
      actions.inputs.patch({
        // type: 'flat',
        content: '布局后代',
      }),
      actions.inputs.patchAsync({
        clicked: (field) => () => {
          field.context.layoutNode(Infinity);
        },
      }),
      mergeHooks({
        fieldResolved(field) {
          field.context.isGlobal$$.subscribe((isGlobal: any) => {
            field.renderConfig.update((config: any) => {
              return { ...config, hidden: isGlobal };
            });
            field.formConfig.update((value: any) => {
              return isGlobal
                ? { ...value, disabled: true, disabledValue: 'delete' }
                : { ...value, disabled: false, disabledValue: 'delete' };
            });
          });
        },
      }),
    ),
  }),
  actions.wrappers.patch([
    {
      type: 'div',
      attributes: { class: clsx([...ColClass, 'grid-cols-2', 'pt-2']) },
    },
  ]),
);
