import { Component, ElementRef, inject, input, viewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { BridgeService } from '../../service';
import { EdgeProps } from '@xyflow/react';
import { MatIconModule } from '@angular/material/icon';
@Component({
  standalone: true,
  imports: [FormsModule, MatIconModule],
  templateUrl: './component.html',
  styleUrl: './component.scss',
  host: {},
})
export class DefaultEdgeComponent {
  props = input.required<EdgeProps>();
  // value = computed<string>(() => {
  //   return this.props().data?.value || '';
  // });
  parent = viewChild.required<ElementRef<HTMLElement>>('parent');
  input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  #service = inject(BridgeService);

  constructor() {
    // effect(() => {
    //   let value = this.value();
    //   untracked(() => {
    //     this.change(value, false);
    //   });
    // });
  }

  change(value: string, update: boolean) {
    const parent = this.parent().nativeElement;
    (parent.dataset as any).value = (value || '').replace(/ /g, '\u00A0');
    const props = this.props();
    if (!props) {
      return;
    }
    if (update) {
      this.#service.instance()!.setEdges((list) => {
        return list.map((item) => {
          if (item.id === this.props().id) {
            return { ...item, data: { ...item.data, value: value } };
          }
          return item;
        });
      });
    }
  }
  deleteItem() {
    this.#service.instance()?.deleteElements({ edges: [this.props()] });
  }
}
