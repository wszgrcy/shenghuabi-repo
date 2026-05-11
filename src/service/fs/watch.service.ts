import { RootStaticInjectOptions, inject, signal } from 'static-injector';
import * as vscode from 'vscode';
import { WorkspaceService } from '../workspace.service';
import {
  BehaviorSubject,
  filter,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

import { MindNode } from '../../share';
import { MIND_GLOB } from '../../const';
import {
  ReactFlowJsonObject,
  Edge,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
} from '@xyflow/react';
import { path } from '@cyia/vfs2';
import { errorFormatByNode } from '@share/util/format/error-format-node';
import { MindFileService } from '../mind/mind-file.service';
import { LogFactoryService } from '../log.service';
interface FileChangeData {
  type: 'change' | 'create';
  value: string;
}
interface FileDeleteData {
  type: 'delete';
  value: string;
}
export interface ResolvedMindFile {
  id: string | undefined;
  filePath: string;
  relPath: string;
  children: (MindNode & {
    relation: {
      input: {
        node: MindNode;
        edge: Edge;
      }[];
      output: {
        node: MindNode;
        edge: Edge;
      }[];
    };
  })[];
  nodes: MindNode[];
  edges: Edge[];
  updateAt: number;
}
/**
 * 改成文件单独处理,返回一个解析好的object,
 * 也就是只改object,然后再加一个处理object
 */
export class WatchService extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);
  #mindFileEvent = new BehaviorSubject<
    FileChangeData | FileDeleteData | undefined
  >(undefined);
  #fileObject = {} as Record<string, Promise<ResolvedMindFile | undefined>>;
  mindList$ = signal<ResolvedMindFile[] | undefined>(undefined);
  #mindFileService = inject(MindFileService);
  fileObject$ = this.#mindFileEvent.pipe(
    filter(Boolean),
    map((item) => {
      if (item.type === 'delete') {
        delete this.#fileObject[item.value];
      } else {
        this.#fileObject[item.value] = this.#parserFile(item.value);
      }
      return this.#fileObject;
    }),
    switchMap((data) => {
      return Promise.all(Object.values(data)).then((list) =>
        (list.filter(Boolean) as ResolvedMindFile[]).sort(
          (a, b) => b.updateAt - a.updateAt,
        ),
      );
    }),
    tap((list) => {
      this.mindList$.set(list);
    }),
    shareReplay(1),
  );
  #channel = inject(LogFactoryService).getLog('system');
  // 仅本地文件才监听,外部的不管
  init() {
    this.fileObject$.subscribe();

    const cwd = this.#workspace.nFolder();
    if (!cwd) {
      this.#channel.warn(`脑图变更未启用`);
      return;
    }
    // 初始化,获得所有
    (async () => {
      const list = this.#workspace.vfs.glob(`**/${MIND_GLOB}`, { cwd: cwd });
      for await (const item of list) {
        this.#mindFileEvent.next({
          type: 'create',
          value: path.join(cwd, item),
        });
      }
    })();

    const watcher = vscode.workspace.createFileSystemWatcher(`**/${MIND_GLOB}`);
    watcher.onDidChange(async (e) => {
      this.#mindFileEvent.next({
        type: 'change',
        value: path.normalize(e.fsPath),
      });
    });
    watcher.onDidCreate(async (e) => {
      this.#mindFileEvent.next({
        type: 'create',
        value: path.normalize(e.fsPath),
      });
    });
    watcher.onDidDelete((e) => {
      this.#mindFileService.remove(e.fsPath);
      this.#mindFileEvent.next({
        type: 'delete',
        value: path.normalize(e.fsPath),
      });
    });
  }
  async #parserFile(filePath: string) {
    const file = this.#mindFileService.getFile(filePath);
    const stat = await this.#workspace.vfs.stat(filePath);
    let data;
    try {
      data = await file.readOriginData();
    } catch (error) {
      console.error(`${filePath}: ${errorFormatByNode(error)}`);
      return undefined;
    }
    const flowNodes = data.flow?.nodes || [];
    flowNodes.forEach((item) => {
      (item as any)['relation'] = this.#setNodeRelations(item, data.flow!);
    });
    const children = [
      ...flowNodes,
      ...(data.storeList || []),
    ] as ResolvedMindFile['children'];

    return {
      id: data.id,
      filePath: filePath,
      relPath: path.relative(this.#workspace.nFolder(), filePath),
      children: children,
      nodes: flowNodes,
      edges: data.flow?.edges || [],
      updateAt: stat.mtime.getTime(),
    };
  }
  #setNodeRelations(
    item: MindNode,
    flow: Partial<ReactFlowJsonObject<MindNode, Edge>>,
  ) {
    const allEdge = getConnectedEdges([item], flow.edges || []);
    const refList = getIncomers(item, flow.nodes!, allEdge);
    const beRefList = getOutgoers(item, flow.nodes!, allEdge);
    return {
      input: refList.map((node) => {
        return {
          node,
          edge: allEdge.find((edge) => edge.source === node.id)!,
        };
      }),
      output: beRefList.map((node) => {
        return {
          node,
          edge: allEdge.find((edge) => edge.target === node.id)!,
        };
      }),
    };
  }
}
