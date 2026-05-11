import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { BridgeService } from '../../service';
import { CustomNode } from '../../type';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ShMarkdownTooltipDirective } from '../../../../directive/markdown-tooltip.directive';
@Component({
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    ShMarkdownTooltipDirective,
  ],
  templateUrl: './component.html',
  styleUrl: './component.scss',
  selector: `node-head`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeHeadComponent {
  props = input.required<CustomNode>();
  parent = viewChild<ElementRef<HTMLElement>>('parent');
  inputTitle = computed(() => this.props().data.title || '');
  #service = inject(BridgeService);
  readonly obj = this.#service.fullNodeObject$$();

  valueChange(value: string) {
    this.#service.patchDataOne(this.props().id, { title: value });
  }
}
