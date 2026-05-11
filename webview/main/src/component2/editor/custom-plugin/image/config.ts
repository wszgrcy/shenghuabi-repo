import { asColumn } from '@cyia/component/valibot-util';
import {
  actions,
  layout,
  setComponent,
  asVirtualGroup,
} from '@piying/view-angular-core';
import * as v from 'valibot';
const {
  inputs: { set: setInputs },
  wrappers: { set: setWrappers },
  class: { component: componentClass },
} = actions;
const floatOptions = [
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' },
  { label: '无', value: '' },
] as const;
export const IMAGE_FORM_CONFIG = v.pipe(
  v.intersect([
    v.object({
      src: v.pipe(
        v.string(),
        setComponent('file-input'),
        setInputs({ placeholder: '请输入文件路径' }),
        v.title('文件'),
        layout({ keyPath: ['#'] }),
      ),
    }),
    v.pipe(
      v.intersect([
        v.pipe(
          v.object({
            usePercent: v.pipe(
              v.optional(v.boolean(), true),
              setComponent('icon-checkbox'),
              setWrappers(['tooltip']),
              setInputs({
                color: 'primary',
                icon: 'percent',
                placeholder: `使用百分比`,
              }),
            ),

            width: v.optional(v.pipe(v.number(), v.title('宽度'))),
          }),
          componentClass('flex items-center gap-2'),
        ),
        v.pipe(
          v.object({
            bindWidth: v.pipe(
              v.optional(v.boolean(), true),
              setComponent('icon-checkbox'),
              setWrappers(['tooltip']),
              setInputs({
                color: 'primary',
                icon: 'link',
                placeholder: `高度与宽度`,
              }),
            ),

            height: v.optional(v.pipe(v.number(), v.title('高度'))),
          }),
          componentClass('flex items-center gap-2'),
        ),
      ]),
      asVirtualGroup(),
      asColumn(),
    ),
    v.object({
      float: v.pipe(
        v.optional(v.picklist(floatOptions.map((item) => item.value)), ''),
        actions.props.patch({ options: floatOptions }),
        v.title('浮动'),
      ),
    }),
  ]),
  asColumn(),
  asVirtualGroup(),
);
