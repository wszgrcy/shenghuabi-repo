import { selectOptions } from '@share/valibot';
import * as v from 'valibot';
import { actions, setComponent } from '@piying/view-angular-core';
export const borderDefaultStyle = {
  'border-top-width.px': '1',
  'border-bottom-width.px': '1',
  'border-left-width.px': '1',
  'border-right-width.px': '1',
} as const;
export const StyleList = [
  { value: 'none', style: { 'border-style': 'none', ...borderDefaultStyle } },
  {
    value: 'dotted',
    style: { 'border-style': 'dotted', ...borderDefaultStyle },
  },
  {
    value: 'dashed',
    style: { 'border-style': 'dashed', ...borderDefaultStyle },
  },
  { value: 'solid', style: { 'border-style': 'solid', ...borderDefaultStyle } },
  {
    value: 'double',
    style: { 'border-style': 'double', ...borderDefaultStyle },
  },
  {
    value: 'groove',
    style: { 'border-style': 'groove', ...borderDefaultStyle },
  },
  { value: 'ridge', style: { 'border-style': 'ridge', ...borderDefaultStyle } },
  { value: 'inset', style: { 'border-style': 'inset', ...borderDefaultStyle } },
  {
    value: 'outset',
    style: { 'border-style': 'outset', ...borderDefaultStyle },
  },
] as const;
export const ColorSchema = v.pipe(
  v.optional(v.string()),
  setComponent('color-picker'),
  actions.class.top('flex-1'),
  v.title('颜色'),
  actions.wrappers.set(['label']),
);
export const StyleSchema = v.pipe(
  v.optional(v.picklist(StyleList.map((item) => item.value)), 'none'),
  v.title('样式'),
  selectOptions(StyleList),
  setComponent('styled-style'),
  actions.wrappers.set(['label']),
  actions.class.top('flex-1'),
);
