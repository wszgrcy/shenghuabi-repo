import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InsertFieldDirective } from '@piying/view-angular';
@Component({
  selector: 'block-wrapper',
  templateUrl: './component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './component.scss',
  imports: [InsertFieldDirective],
})
export class BlockWrapper {}
