import { Injectable, signal } from '@angular/core';

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
}
