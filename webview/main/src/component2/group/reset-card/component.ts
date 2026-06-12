import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PiyingViewGroupBase } from '@piying/view-angular';
import { NgTemplateOutlet } from '@angular/common';
@Component({
  selector: 'reset-card',
  templateUrl: './component.html',
  imports: [NgTemplateOutlet],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetCardFGC extends PiyingViewGroupBase {
  reset() {
    this.field$$().form.control!.reset(undefined);
  }
}
