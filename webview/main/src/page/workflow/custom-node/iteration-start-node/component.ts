import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { BridgeService } from '../../service';
import { CustomNode } from '../../type';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './component.html',
  styleUrl: './component.scss',
  selector: `iteration-start-node`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IterationStartNodeComponent {
  props = input.required<CustomNode>();
  #service = inject(BridgeService);
}
