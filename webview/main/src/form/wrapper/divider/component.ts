import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { InsertFieldDirective } from '@piying/view-angular';

@Component({
  selector: 'cyia-divider-wrapper',
  templateUrl: './component.html',
  standalone: true,
  imports: [InsertFieldDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CyiaDividerWrapper {
  static __version = 2;
  templateRef = viewChild.required('templateRef');
}
