import { Injectable, Signal, signal } from '@angular/core';
import { CustomNode } from '@bridge/share';

@Injectable()
export class NodeService {
  nodeList$ = signal<any[]>([]);
  add(item: any) {
    this.nodeList$.update((list) => {
      list = list.slice();
      list[list.length] = item.reactPortal;
      return list;
    });
  }
  props$!: Signal<CustomNode>;
}
