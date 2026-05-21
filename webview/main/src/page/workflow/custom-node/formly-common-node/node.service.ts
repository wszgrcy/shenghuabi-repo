import { Injectable, Signal, signal } from '@angular/core';
import { CustomNode } from '@bridge/share';
import { PiResolvedViewFieldConfig } from '@piying/view-angular';

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
  nodeIdSet$ = signal<Map<string, () => PiResolvedViewFieldConfig>>(new Map(), {
    equal: () => false,
  });
  addCanLinkId(id: string, field: () => PiResolvedViewFieldConfig) {
    this.nodeIdSet$().set(id, field);
    this.nodeIdSet$.set(this.nodeIdSet$());
  }
  removeCanLinkId(id: string) {
    this.nodeIdSet$().delete(id);
    this.nodeIdSet$.set(this.nodeIdSet$());
  }
}
