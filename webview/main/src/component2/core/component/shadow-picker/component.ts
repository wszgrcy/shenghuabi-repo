import { Component, computed, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

import { MatTooltipModule } from '@angular/material/tooltip';
import { deepClone } from '../../util/clone';

import { SelectorlessOutlet } from '@cyia/ngx-common/directive';
import * as v from 'valibot';
import { actions, BaseControl, PiyingView } from '@piying/view-angular';
import {
  nfcComponent,
  setAlias,
  setComponent,
} from '@piying/view-angular-core';
import { PresetDefine } from '@piying-lib/angular-daisyui/preset';
import { OffsetPickerNFCC } from './offset-picker/component';
export const DEFAULT_VALUE = {
  type: '',
  offset: { x: 0, y: 0 },
  blur: 1,
  spread: 1,
  color: '#000000',
};
@Component({
  selector: 'shadow-picker',
  templateUrl: './component.html',
  styleUrls: ['./component.scss'],
  standalone: true,
  imports: [FormsModule, MatTooltipModule, SelectorlessOutlet],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShadowPickerFCC),
      multi: true,
    },
  ],
})
export class ShadowPickerFCC extends BaseControl {
  schema = v.pipe(
    v.intersect([
      v.object({
        type: v.pipe(
          v.string(),
          setComponent('radio'),
          actions.inputs.patch({
            options: [
              { label: '外部', value: '' },
              { label: '内部', value: 'inset' },
            ],
          }),
          v.title('类型'),
          actions.wrappers.set([
            { type: 'label' },
            { type: 'div', attributes: { class: 'flex gap-2' } },
          ]),
        ),
      }),
      v.pipe(
        v.intersect([
          v.pipe(
            v.object({
              offset: v.object({
                x: v.pipe(
                  v.number(),
                  setComponent('input-number'),
                  v.description('水平偏移'),
                  actions.inputs.patch({ min: -20, max: 20 }),
                  actions.wrappers.patch(['tooltip']),
                ),
                y: v.pipe(
                  v.number(),
                  setComponent('input-number'),
                  v.description('竖直偏移'),
                  actions.inputs.patch({ min: -20, max: 20 }),
                  actions.wrappers.patch(['tooltip']),
                ),
              }),
              color: v.pipe(
                v.string(),
                setComponent('autocomplete'),
                actions.inputs.patch({ type: 'color', allowCustom: true }),
                v.description('颜色'),
                actions.wrappers.patch(['tooltip']),
              ),
            }),
            setAlias('offset'),
            actions.wrappers.patch([
              { type: 'div', attributes: { class: 'grid gap-2' } },
            ]),
          ),
          v.pipe(
            v.optional(
              v.object({ __offsetPicker: nfcComponent(OffsetPickerNFCC) }),
            ),
            actions.wrappers.patch(['div']),
          ),
        ]),
        actions.wrappers.patch([
          { type: 'div', attributes: { class: 'grid grid-cols-2' } },
        ]),
      ),
      v.object({
        blur: v.pipe(v.number(), setComponent('input-number'), v.title('模糊')),
        spread: v.pipe(
          v.number(),
          setComponent('input-number'),
          v.title('扩散'),
        ),
      }),
    ]),
    // asVirtualGroup(),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: 'grid gap-2' } },
    ]),
    actions.hooks.merge({
      allFieldsResolved: (field) => {
        field.form.root.valueChanges.subscribe((value) => {
          this.valueAndTouchedChange(value);
        });
      },
    }),
  );
  PiyingView = PiyingView;
  piyingInput = computed(() => {
    return {
      schema: this.schema,
      model: this.value$,
      options: {
        fieldGlobalConfig: {
          types: {
            radio: PresetDefine.types.radio,
            'input-number': PresetDefine.types['input-number'],
            autocomplete: PresetDefine.types.autocomplete,
            object: PresetDefine.types.object,
            'intersect-group': PresetDefine.types.object,
            intersect: PresetDefine.types.object,
          },
          wrappers: {
            div: PresetDefine.wrappers.div,
            label: PresetDefine.wrappers['label-wrapper'],
            'label-wrapper': PresetDefine.wrappers['label-wrapper'],
            tooltip: PresetDefine.wrappers.tooltip,
          },
        },
      },
      selectorless: true,
    };
  });
  override writeValue(obj: any): void {
    if (obj) {
      if (!Object.keys(obj).length) {
        this.value$.set(deepClone(DEFAULT_VALUE));
      } else {
        this.value$.set(obj);
      }
    } else {
      this.value$.set(deepClone(DEFAULT_VALUE));
    }
  }
}
