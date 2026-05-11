import clsx from 'clsx';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DirectionMap } from './define';
import { MatTooltipModule } from '@angular/material/tooltip';
import { commonConfig } from '@fe/util/common-config';
import { deepEqual } from 'fast-equals';
import { asVirtualGroup, actions } from '@piying/view-angular-core';
import { PiyingView } from '@piying/view-angular';
import * as v from 'valibot';

import {
  BoxType,
  ColClass,
  deepClone,
  Direction,
  PickerConfig,
} from '@bridge/share';
import { FieldGlobalConfig } from '@fe/piying/define';
@Component({
  selector: 'box-picker',
  templateUrl: './component.html',
  styleUrls: ['./component.scss'],
  standalone: true,
  imports: [MatTooltipModule, PiyingView],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BoxPickerFCC),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoxPickerFCC implements ControlValueAccessor {
  schema = v.pipe(
    PickerConfig,
    asVirtualGroup(),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: clsx(ColClass) } },
    ]),
  );
  options = {
    fieldGlobalConfig: FieldGlobalConfig,
  };
  /** 部分模型使用 */
  models = signal<v.InferInput<typeof PickerConfig>>({} as any);
  DirectionMap = DirectionMap;
  /** 真数据 */
  value: Partial<
    Record<Extract<Direction, 'left' | 'right' | 'top' | 'bottom'>, BoxType>
  > = {};
  Direction = Direction;
  isAxis$ = computed(() => {
    return (
      this.models().direction === Direction.x ||
      this.models().direction === Direction.y
    );
  });
  constructor() {}

  ngOnInit(): void {}
  writeValue(obj: any): void {
    if (obj === undefined) {
      obj = {
        left: { radius: 0, style: 'none', color: null, width: 0 },
        right: { radius: 0, style: 'none', color: null, width: 0 },
        top: { radius: 0, style: 'none', color: null, width: 0 },
        bottom: { radius: 0, style: 'none', color: null, width: 0 },
      };
    }

    if (obj) {
      this.value = deepClone(obj);
      const xEqual = deepEqual(obj.left, obj.right);
      const yEqual = deepEqual(obj.top, obj.bottom);
      const ltEqual = deepEqual(obj.left, obj.top);

      if (xEqual && yEqual && ltEqual) {
        this.toggle(Direction.global);
      } else if (xEqual) {
        this.toggle(Direction.x);
      } else if (yEqual) {
        this.toggle(Direction.y);
      } else {
        this.toggle(Direction.left);
      }
    }
  }
  #onChange?: (value: any) => void;
  registerOnChange(fn: any): void {
    this.#onChange = fn;
  }
  registerOnTouched(fn: any): void {}
  toggle(direction: Direction) {
    let models;
    switch (direction) {
      case Direction.global:
        models = {
          direction,
          data:
            commonConfig([
              this.value.left,
              this.value.right,
              this.value.top,
              this.value.bottom,
            ]) || ({} as any),
        };
        break;
      case Direction.x:
        models = {
          direction,
          data:
            commonConfig([this.value.left, this.value.right]) || ({} as any),
        };
        break;
      case Direction.y:
        models = {
          direction,
          data:
            commonConfig([this.value.top, this.value.bottom]) || ({} as any),
        };
        break;
      default:
        models = {
          direction,
          data: this.value[direction] || ({} as any),
        };
        break;
    }
    this.models.set(deepClone(models));
  }
  valueChange(data: v.InferOutput<typeof PickerConfig>) {
    switch (data.direction) {
      case 'global':
        this.value = {
          left: data.data,
          right: data.data,
          top: data.data,
          bottom: data.data,
        };
        break;
      case 'x':
        this.value.left = data.data;
        this.value.right = data.data;
        break;
      case 'y':
        this.value.top = data.data;
        this.value.bottom = data.data;
        break;
      default:
        this.value[data.direction] = data.data;
        break;
    }
    this.#onChange?.(deepClone(this.value));
  }
}
