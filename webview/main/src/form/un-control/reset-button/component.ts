import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { isFormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PI_VIEW_FIELD_TOKEN } from '@piying/view-angular';
import { KeyPath } from '@piying/view-angular-core';

@Component({
  selector: 'reset-button',
  templateUrl: './component.html',
  providers: [],
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  host: {
    class: 'form-minimum flex',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetButtonNFCC {
  field = inject(PI_VIEW_FIELD_TOKEN);
  keyPath = input<KeyPath>();

  redo() {
    let child;
    if (this.keyPath()) {
      child = this.field().get(this.keyPath()!);
    } else {
      child = this.field().get(['..', '..', 'value']);
    }
    if (isFormArray(child?.form.control)) {
      while (child.children!()!.length) {
        child.action.remove(0);
      }
    } else {
      child?.form.control!.reset();
    }
  }
}
