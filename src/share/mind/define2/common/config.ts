import clsx from 'clsx';
import {
  actions,
  asVirtualGroup,
  mergeHooks,
  setComponent,
} from '@piying/view-angular-core';
import * as v from 'valibot';
import { RowClass, ColClass } from './create-group';
import { noKey } from './void.schema';
export const NodeConfigDefine = v.pipe(
  v.intersect([
    v.pipe(
      v.object({
        theme: v.pipe(
          v.optional(v.string()),
          v.title('主题'),
          setComponent('select'),
          actions.inputs.set({
            options: [],
          }),
          actions.class.top('flex-1'),
          actions.inputs.patchAsync({
            options: (field) => field.context.getAllTheme(),
          }),
        ),
        // __creatTheme: v.pipe(
        //   noKey,
        //   v.description('打开或创建主题'),
        //   componentDefine({
        //     type: 'button',
        //     wrappers: ['tooltip'],
        //     inputs(context) {
        //       return {
        //         icon: 'open_in_new',
        //         clicked: () => {
        //           // todo 应该增加创建主题.如果没有文件夹还要创建文件夹,然后还需要刷新,主题名不变的情况下刷新主题
        //         },
        //       };
        //     },
        //   }),
        // ),
        __openThemeDir: v.pipe(
          noKey,
          v.description('打开主题文件夹'),

          setComponent('button'),
          actions.wrappers.set(['tooltip']),
          actions.inputs.patch({
            shape: 'circle',
            style: 'ghost',
            content: { icon: { fontIcon: 'attach_file' } },
          }),
          actions.inputs.patchAsync({
            clicked: (field) => () => {
              field.context.openThemeDir();
            },
          }),
        ),
      }),
      actions.wrappers.patch([
        { type: 'div', attributes: { class: clsx('flex', 'items-end', 'gap-2') } },
      ]),
    ),
    v.pipe(
      v.object({
        template: v.pipe(
          v.optional(v.string()),
          setComponent('node-template-apply'),
        ),
      }),
    ),
  ]),
  asVirtualGroup(),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: clsx(ColClass) } },
  ]),

  mergeHooks({
    allFieldsResolved: (field) => {
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
);
