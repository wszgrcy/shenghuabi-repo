import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { BridgeService } from '../../service';
import { EdgeProps } from '@xyflow/react';
import { MatIconModule } from '@angular/material/icon';
import { SpanInputFCC } from '@cyia/component/core';
@Component({
  standalone: true,
  imports: [FormsModule, MatIconModule, SpanInputFCC],
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
  label = computed(() => {
    return this.props().label || '';
  });
  constructor() {
    // effect(() => {
    //   let value = this.value();
    //   untracked(() => {
    //     this.change(value, false);
    //   });
    // });
  }

  deleteItem() {
    this.#service.instance()!.setEdges((list) => {
      return list.filter((item) => item.id !== this.props().id);
    });
  }
  valueChange(value: string) {
    this.#service.instance()!.setEdges((list) => {
      return list.map((item) => {
        if (item.id === this.props().id) {
          return { ...item, label: value };
        }
        return item;
      });
    });
  }
}
