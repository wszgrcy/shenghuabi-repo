import { RootStaticInjectOptions, inject, signal } from 'static-injector';
import { WatchService } from '../fs/watch.service';
import type { Edge } from '@xyflow/react';
import { MindNodeExtra } from '../../type';
import { MindNode } from '../../share';
export interface DagangData {
  filePath: string;
  nodes: MindNode[];
  children: (Partial<MindNode> & { id: string } & MindNodeExtra)[];
  edges: Edge[];
  id?: string;
}
export class FileService extends RootStaticInjectOptions {
  #watch = inject(WatchService);
  dagangSignal = signal<DagangData[]>([]);
  init() {
    this.#watch.fileObject$.subscribe((data) => {
      this.dagangSignal.set(data);
    });
  }
}
