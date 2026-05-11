import clsx from 'clsx';
import * as v from 'valibot';
import {
  actions,
  asControl,
  asVirtualGroup,
  getDefaults,
  layout,
  setComponent,
} from '@piying/view-angular-core';
import {
  createEnable,
  createGroup,
  ResetSchema,
  RowClass,
} from './create-group';
import { ColorSchema, StyleSchema } from './color';
import { BoxPickerInputType } from './box-picker';
import { CSSInterpolation, CSSObject } from '@emotion/serialize';

export const ShadowDefine = v.object({
  type: v.optional(v.picklist(['', 'inset']), ''),
  offset: v.object({
    x: v.optional(v.number(), 0),
    y: v.optional(v.number(), 0),
  }),
  blur: v.optional(v.number(), 1),
  spread: v.optional(v.number(), 1),
  color: v.optional(v.string(), '#000'),
});
/** 必须维持初始值,因为定义在表单中使用 */
const STYLE_DEFINE = v.pipe(
  v.object({
    background: v.optional(
      v.pipe(
        v.object({
          enable: v.pipe(createEnable('填充'), actions.class.top('flex-none')),
          value: v.optional(
            v.pipe(
              v.object({
                backgroundColor: v.pipe(
                  v.optional(v.string()),
                  setComponent('color-picker'),
                  actions.class.top('flex-1'),

                  layout({ keyPath: ['..', '..'] }),
                ),
              }),
            ),
          ),
        }),
        actions.wrappers.patch([
          { type: 'div', attributes: { class: clsx(RowClass) } },
        ]),
      ),
    ),
    border: createGroup(
      [
        v.pipe(
          v.object({
            enable: createEnable('内边框'),
            __reset: ResetSchema,
          }),
          actions.wrappers.patch([
            { type: 'div', attributes: { class: clsx(RowClass) } },
          ]),
        ),
        v.pipe(
          v.object({
            value: v.optional(
              v.pipe(
                v.custom<BoxPickerInputType>(Boolean),
                asControl(),
                setComponent('box-picker'),
              ),
            ),
          }),
        ),
      ],
      { cardWrapper: true },
    ),
    outline: createGroup([
      v.pipe(
        v.object({
          enable: createEnable('外边框'),
          __reset: ResetSchema,
        }),
        actions.wrappers.patch([
          { type: 'div', attributes: { class: clsx(RowClass) } },
        ]),
      ),
      v.pipe(
        v.object({
          value: v.optional(
            v.pipe(
              v.intersect([
                v.pipe(
                  v.object({
                    color: ColorSchema,
                    style: StyleSchema,
                  }),
                  actions.wrappers.patch([
                    { type: 'div', attributes: { class: clsx(RowClass) } },
                  ]),
                ),
                v.object({
                  width: v.pipe(
                    v.optional(v.number(), 0),
                    v.title('宽度'),
                    setComponent('number-input'),
                    actions.inputs.set({ max: 20 }),
                    // layout({ keyPath: ['..', '..'] }),
                  ),
                  offset: v.pipe(
                    v.optional(v.number(), 0),
                    v.title('偏移'),
                    setComponent('number-input'),
                    actions.inputs.set({ max: 20 }),
                    // layout({ keyPath: ['..', '..'] }),
                  ),
                }),
              ]),
              asVirtualGroup(),
            ),
          ),
        }),
      ),
    ]),
    boxShadow: createGroup(
      [
        v.pipe(
          v.object({
            enable: createEnable('阴影'),
            __reset: ResetSchema,
          }),
          actions.wrappers.patch([
            { type: 'div', attributes: { class: clsx(RowClass) } },
          ]),
        ),
        v.pipe(
          v.object({
            // todo 类型创建
            value: v.optional(
              v.pipe(
                v.array(
                  v.pipe(
                    v.optional(
                      v.custom<v.InferInput<typeof ShadowDefine>>(Boolean),
                      getDefaults(ShadowDefine),
                    ),
                    asControl(),
                    setComponent('shadow-picker'),
                  ),
                ),
                setComponent('chip-array'),
                actions.inputs.patchAsync({
                  chipLabel: (field) => (index: number) => `阴影${index}`,
                }),
              ),
            ),
          }),
        ),
      ],
      { cardWrapper: true },
    ),
    font: createGroup([
      v.pipe(
        v.object({
          enable: createEnable('文字'),
          __reset: ResetSchema,
        }),
        actions.wrappers.patch([
          { type: 'div', attributes: { class: clsx(RowClass) } },
        ]),
      ),
      v.pipe(
        v.object({
          value: v.optional(
            v.pipe(
              v.object({
                fontSize: v.pipe(
                  v.optional(v.number()),
                  v.title('字体大小'),
                  actions.class.top('flex-1'),
                ),
                color: v.pipe(
                  v.optional(v.string()),
                  v.title('颜色'),
                  setComponent('color-picker'),
                  actions.wrappers.set(['label']),
                  actions.class.top('flex-1'),
                ),
              }),
              actions.wrappers.patch([
                { type: 'div', attributes: { class: clsx(RowClass) } },
              ]),
            ),
          ),
        }),
      ),
    ]),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid gap-2' } },
  ]),
);

export const STYLE_LAYOUT_DEFINE = v.pipe(
  v.object({
    main: v.pipe(v.optional(STYLE_DEFINE), v.title('默认')),
    ':hover': v.pipe(v.optional(STYLE_DEFINE), v.title('悬停')),
  }),
  setComponent('tabs'),
  actions.inputs.patch({
    type: 'lift',
  }),
);

function boxToRule(item: Partial<BoxPickerInputType>): CSSInterpolation {
  return {
    borderLeftWidth: item.left?.width,
    borderRightWidth: item.right?.width,
    borderTopWidth: item.top?.width,
    borderBottomWidth: item.bottom?.width,
    borderLeftColor: item.left?.color ?? undefined,
    borderRightColor: item.right?.color ?? undefined,
    borderTopColor: item.top?.color ?? undefined,
    borderBottomColor: item.bottom?.color ?? undefined,
    borderLeftStyle: item.left?.style,
    borderRightStyle: item.right?.style,
    borderTopStyle: item.top?.style,
    borderBottomStyle: item.bottom?.style,
    borderTopLeftRadius: item.top?.radius,
    borderTopRightRadius: item.right?.radius,
    borderBottomRightRadius: item.bottom?.radius,
    borderBottomLeftRadius: item.left?.radius,
  };
}
function styleDefineToRule(
  item: v.InferOutput<typeof STYLE_DEFINE> | undefined,
) {
  if (!item) {
    return {};
  }
  let obj: CSSObject = {};
  if (item.background && item.background.enable) {
    if (item.background.value?.backgroundColor) {
      // let data = tinyColor(item.background.value?.backgroundColor).toRgb();
      obj['--node-theme-background-color'] =
        item.background.value?.backgroundColor;
      obj.backgroundColor = `var(--node-theme-background-color)`;
      // obj['--node-theme-background-color-red'] = data.r;
      // obj['--node-theme-background-color-green'] = data.g;
      // obj['--node-theme-background-color-blue'] = data.b;
      // obj['--node-theme-background-color-alpha'] = data.a;
    }
  }
  if (item.border && item.border.enable && item.border.value) {
    obj = { ...obj, ...(boxToRule(item.border.value) as any) } as CSSObject;
  }
  if (item.boxShadow && item.boxShadow.enable && item.boxShadow.value) {
    obj.boxShadow = item.boxShadow.value
      .map((item) => {
        return `${item.type} ${item.color} ${item.offset.x}px ${item.offset.y}px ${item.blur}px ${item.spread}px`;
      })
      .join(',');
  }
  if (item.font && item.font.enable && item.font.value) {
    obj.fontSize = item.font.value.fontSize ?? undefined;
    obj.color = item.font.value.color ?? undefined;
  }
  if (item.outline && item.outline.enable && item.outline?.value) {
    obj.outlineColor = item.outline.value.color ?? undefined;
    obj.outlineOffset = item.outline.value.offset ?? undefined;
    obj.outlineStyle = item.outline.value.style;
    obj.outlineWidth = item.outline.value.width;
  }
  return obj;
}
export const STYLE_Transformer = v.pipe(
  v.optional(STYLE_LAYOUT_DEFINE),
  v.transform((style) => {
    if (!style) {
      return {};
    }
    return {
      ...styleDefineToRule(style.main),
      ':hover': styleDefineToRule(style[':hover']),
    };
  }),
);
