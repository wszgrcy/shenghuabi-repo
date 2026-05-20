import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InsertFieldDirective } from '@piying/view-angular';
@Component({
  selector: 'app-use-ref',
  templateUrl: './component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InsertFieldDirective],
})
export class UseRefWrapper {}
