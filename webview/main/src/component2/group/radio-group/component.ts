import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';

import { MatTabsModule } from '@angular/material/tabs';
import { PiyingViewGroupBase } from '@piying/view-angular';
import { FieldLogicGroup } from '@piying/view-angular-core';
@Component({
  selector: 'cyia-radio-group',
  templateUrl: './component.html',
  standalone: true,
  imports: [MatTabsModule, NgTemplateOutlet, MatRadioModule],
  styleUrl: './component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioFGC extends PiyingViewGroupBase {
  index$ = computed(() => {
    const lg = this.field$$().form.control as FieldLogicGroup;
    return lg.activateIndex$();
  });

  activateChanged(index: number) {
    const lg = this.field$$().form.control as FieldLogicGroup;
    lg.activateIndex$.set(index);
    lg.children$$()[index].updateValue(undefined);
  }
}
