import {
  Component,
  ChangeDetectionStrategy,
  output,
  input,
  forwardRef,
} from '@angular/core';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgStyle } from '@angular/common';
import { SelectOptionsPipe } from './select-options.pipe';
import { MatIconModule } from '@angular/material/icon';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { BaseControl } from '@piying/view-angular';

@Component({
  selector: 'styled-select',
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatSelectModule,
    ReactiveFormsModule,
    SelectOptionsPipe,
    NgStyle,
    MatIconModule,
    PurePipe,
    FormsModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StyledSelectFCC),
      multi: true,
    },
  ],
})
// 好像是那个方向的组件
export class StyledSelectFCC extends BaseControl {
  /** ---输入--- */
  /** @default '' */
  placeholder = input<string>('');
  /** @title 多选
  @default false */
  multiple = input<boolean>(false);
  /** @title 面板类
  @default [] */
  panelClass = input([]);
  /** @title 列表
  @default [] */
  options = input<any[]>([]);
  /** ---输出--- */
  /** @title 选择变更 */
  change = output<MatSelectChange>();

  compareWith(o1: any, o2: any) {
    return o1 === o2;
  }

  getItem = (value: any) => {
    return (this.options() as any[]).find((item) => item.value === value);
  };
}
