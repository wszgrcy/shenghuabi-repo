import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  Injector,
  input,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRipple, MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { BaseControl } from '@piying/view-angular';
import { effectOnce } from '../../util/effect-once';

@Component({
  selector: 'icon-checkbox',
  templateUrl: './component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IconCheckboxFCC),
      multi: true,
    },
  ],
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatRippleModule],
  styleUrl: './component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconCheckboxFCC extends BaseControl {
  /** ---输入--- */
  /** @title 图标 */
  icon = input<string>();
  /** @title 颜色
  @default 'primary' */
  color = input<string>('primary');
  /** ---输出--- */

  ripple = viewChild(MatRipple);
  #injector = inject(Injector);

  #setRip(value: boolean) {
    effectOnce(
      () => this.ripple(),
      (rip) => {
        if (value) {
          rip.launch({ centered: true, persistent: true, radius: 9999 });
        } else {
          rip.fadeOutAll();
        }
      },
      this.#injector,
    );
  }
  toggle() {
    this.value$.update((item) => !item);
    this.#setRip(this.value$());
  }
  override writeValue(obj: any): void {
    super.writeValue(obj);
    this.#setRip(this.value$());
  }
}
