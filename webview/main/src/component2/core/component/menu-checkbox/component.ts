import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseControl } from '@piying/view-angular';
import { MenuCheckboxOption } from './type';
@Component({
  selector: 'menu-checkbox',
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MenuCheckboxFCC),
      multi: true,
    },
  ],
})
export class MenuCheckboxFCC extends BaseControl {
  /** ---输入--- */
  /** @default {"icon":"help","description":"未知"} */
  unknownOption = input<{ icon: string; description: string; color?: string }>({
    icon: 'help',
    description: '未知',
  });
  /** @title 列表 */
  options = input.required<MenuCheckboxOption[]>();
  /** @description 默认显示options中的description,也可以替换 */
  description = input<string>();
  /** ---输出--- */

  item = computed(() => {
    return (
      this.options().find((item) => item.value === this.value$()) ||
      this.unknownOption()
    );
  });
  loading$ = signal(false);
  async buttonClicked(value: any, index: number) {
    this.loading$.set(true);
    try {
      const option = this.options()[index];
      if (option.beforeChange) {
        const result = await option.beforeChange();
        if (!result) {
          return;
        }
      }
      this.valueChange(value);
    } catch (error) {
    } finally {
      this.loading$.set(false);
    }
  }
}
