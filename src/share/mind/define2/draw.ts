import * as v from 'valibot';

import { NodeCommonDefine, transform } from './common/node-data';
import { STYLE_LAYOUT_DEFINE } from './common/style';
/** 是否需要更准确 */
export const DrawValueDefine = v.optional(
  v.object({
    elements: v.any(),
    appState: v.any(),
    files: v.any(),
  }),
);
// 默认值

export const DrawDefaultDefine = v.object({
  transform: v.optional(transform, { resizable: false, display: true }),
  value: DrawValueDefine,
  style: v.optional(STYLE_LAYOUT_DEFINE, {
    main: {
      background: {
        enable: true,
        value: {
          backgroundColor: '#00000000',
        },
      },
      border: {
        enable: true,
        value: {
          left: { radius: 0, color: '', width: 0, style: 'none' },
          right: { radius: 0, color: '', width: 0, style: 'none' },
          top: { radius: 0, color: '', width: 0, style: 'none' },
          bottom: { radius: 0, color: '', width: 0, style: 'none' },
        },
      },
    },
  }),
});

//定义

export const DrawDataDefine = v.object({
  ...NodeCommonDefine.entries,
  ...DrawDefaultDefine.entries,
});

export type DrawDataType = v.InferOutput<typeof DrawDataDefine>;
