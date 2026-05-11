import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  viewChild,
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
  selector: `iteration-node`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IterationNodeComponent {
  props = input.required<CustomNode>();
  parent = viewChild<ElementRef<HTMLElement>>('parent');
  #service = inject(BridgeService);

  constructor() {}
}
