import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseControl } from '@piying/view-angular';

@Component({
  templateUrl: './component.html',
  standalone: true,
  selector: `cyia-slider`,
  imports: [MatSliderModule, FormsModule, MatFormFieldModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderFCC),
      multi: true,
    },
  ],
  styleUrl: './component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderFCC extends BaseControl {
  /** @default 0 */
  min = input<number>(0);
  /** @default 100 */
  max = input<number>(100);
  /** @default 1 */
  step = input<number>(1);
  /** ---输出--- */
  discrete = input<boolean>(true);
  /** ---输出--- */
  showTickMarks = input<boolean>(false);
}
