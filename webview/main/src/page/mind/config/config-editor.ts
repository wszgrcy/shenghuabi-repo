import clsx from 'clsx';
import * as v from 'valibot';
import {
  actions,
  asVirtualGroup,
  layout,
  mergeHooks,
  renderConfig,
  formConfig,
  setComponent,
  setAlias,
} from '@piying/view-angular-core';

import {
  CardEditorDefine,
  ColClass,
  GlobalConfigDefine,
  Node_EDGE_DEFINE,
  NodeConfigDefine,
  NodeLayoutDefine,
  STYLE_LAYOUT_DEFINE,
} from '@bridge/share';
import { map } from 'rxjs';

const COMMON_DEFINE = v.pipe(
  v.object({
    style: STYLE_LAYOUT_DEFINE,
    config: v.optional(NodeConfigDefine),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: clsx(ColClass) } },
  ]),
);

export const MIND_DEFINE = v.pipe(
  v.intersect([
    v.pipe(
      v.object({
        data: v.pipe(
          v.intersect([
            v.pipe(
              COMMON_DEFINE,
              v.title('样式'),
              layout({ keyPath: ['#', '@tabGroup'] }),
              actions.props.patchAsync({
                title: (field) =>
                  field.context.isGlobal$$.pipe(
                    map((value) => (value ? '全局样式' : '样式')),
                  ),
              }),
            ),

            v.object({
              edge: v.pipe(
                Node_EDGE_DEFINE,
                v.title('边'),
                layout({ keyPath: ['#', '@tabGroup'] }),
              ),
            }),
            v.object({
              layout: v.pipe(
                NodeLayoutDefine,
                v.title('布局'),
                layout({ keyPath: ['#', '@tabGroup'] }),
              ),
            }),
            v.object({
              // style: STYLE_LAYOUT_DEFINE,
              editor: v.pipe(
                // card/chat下才用,并且不一定必选
                v.optional(CardEditorDefine),
                v.title('编辑器'),
                mergeHooks({
                  fieldResolved(field) {
                    field.context.enableEditorConfig$$.subscribe(
                      (enable: any) => {
                        field.renderConfig.update((config) => {
                          return { ...config, hidden: !enable };
                        });
                        field.formConfig.update((value) => {
                          return !enable
                            ? {
                                ...value,
                                disabled: true,
                                disabledValue: 'delete',
                              }
                            : {
                                ...value,
                                disabled: false,
                                disabledValue: 'delete',
                              };
                        });
                      },
                    );
                  },
                }),
                layout({ keyPath: ['#', '@tabGroup'] }),
              ),
            }),
          ]),
          asVirtualGroup(),
        ),
      }),
      renderConfig({ hidden: true }),
    ),
    v.pipe(
      GlobalConfigDefine,
      v.title('配置'),
      mergeHooks({
        fieldResolved(field) {
          field.context.isGlobal$$.subscribe((isGlobal: any) => {
            field.renderConfig.update((config) => {
              return { ...config, hidden: !isGlobal };
            });
            // 不能改当前的form,因为是虚拟的,所以会自动禁用父级
            // field.formConfig.update((value) => {
            //   return !isGlobal
            //     ? {
            //         ...value,
            //         disabled: true,
            //         disabledValue: 'delete',
            //       }
            //     : {
            //         ...value,
            //         disabled: false,
            //         disabledValue: 'delete',
            //       };
            // });
          });
        },
      }),
      layout({ keyPath: ['#', '@tabGroup'] }),
    ),
  ]),
  asVirtualGroup(),
  // componentDefine({ type: 'tab-group', alias: 'tabGroup' }),
  setComponent('tabs'),
  actions.inputs.patch({
    type: 'lift',
    // 隐藏问题
    activatedIndex: 1,
  }),
  setAlias('tabGroup'),
  // actions.class.component(ColClass),
  formConfig({ groupMode: 'loose' }),
);
