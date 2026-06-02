import { RootStaticInjectOptions, inject, signal } from 'static-injector';
import * as vscode from 'vscode';
import { watch } from 'node:fs';
// import { watch } from 'fs/promises';
import { WorkspaceService } from '../workspace.service';
import {
  BehaviorSubject,
  bufferTime,
  debounceTime,
  filter,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

import { MindNode } from '../../share';
import { MIND_GLOB } from '../../const';
import { WorkflowFileService } from '@shenghuabi/workflow';
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
interface WorkflowFileChangeData {
  type: 'change' | 'create';
  value: string;
}
interface WorkflowFileDeleteData {
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
  #workflowFileService = inject(WorkflowFileService);
  #workflowFileObject = {} as Record<string, Promise<any>>;
  #workflowFileEvent = new BehaviorSubject<
    WorkflowFileChangeData | WorkflowFileDeleteData | undefined
  >(undefined);
  workflowList$ = signal<
    { filePath: string; data: any; relPath: string }[] | undefined
  >(undefined);
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
  workflowFileObject$ = this.#workflowFileEvent.pipe(
    bufferTime(1000),
    filter((list) => !!list.length),
    map((list) => {
      const deduped = Object.values(
        list.reduce(
          (acc, item) => {
            if (item?.value) {
              acc[item.value] = item;
            }
            return acc;
          },
          {} as Record<string, (typeof list)[number]>,
        ),
      );
      for (const item of deduped) {
        if (!item) {
          continue;
        }
        if (item.type === 'delete') {
          delete this.#workflowFileObject[item.value];
        } else {
          this.#workflowFileObject[item.value] = this.#parserWorkflowFile(
            item.value,
          );
        }
      }
      return this.#workflowFileObject;
    }),
    switchMap((data) => {
      return Promise.all(
        Object.entries(data).map(async ([filePath, promise]) => {
          return {
            filePath,
            data: await promise,
            relPath: path
              .relative(this.#workspace.dir['workflowDir'](), filePath)
              .replace(/\.workflow$/, ''),
          };
        }),
      );
    }),
    tap((list) => {
      this.workflowList$.set(list);
    }),
    shareReplay(1),
  );
  #channel = inject(LogFactoryService).getLog('system');
  // 仅本地文件才监听,外部的不管
  init() {
    this.fileObject$.subscribe();
    this.workflowFileObject$.subscribe();

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

    // 工作流文件监听
    (async () => {
      let workflowDir = this.#workspace.dir['workflowDir']();
      const list = this.#workspace.vfs.glob(`**/*.workflow`, {
        cwd: workflowDir,
      });
      for await (const item of list) {
        this.#workflowFileEvent.next({
          type: 'create',
          value: path.join(workflowDir, item),
        });
      }
      // 使用 fs.watch 监听 workflow 目录
      try {
        const watcher = watch(
          workflowDir,
          { recursive: true },
          async (eventType, filename) => {
            if (!filename) return;
            const fullPath = path.join(workflowDir, filename);
            if (eventType === 'change') {
              this.#workflowFileEvent.next({
                type: 'change',
                value: path.normalize(fullPath),
              });
            } else {
              try {
                await this.#workspace.vfs.stat(fullPath);
                this.#workflowFileEvent.next({
                  type: 'create',
                  value: path.normalize(fullPath),
                });
              } catch {
                this.#workflowFileService.remove(fullPath);
                this.#workflowFileEvent.next({
                  type: 'delete',
                  value: path.normalize(fullPath),
                });
              }
            }
          },
        );

        watcher.on('error', (error) => {
          this.#channel.warn(`工作流文件监听错误: ${error}`);
        });
      } catch (error) {
        this.#channel.warn(`无法使用 fs.watch 监听从工作流目录: ${error}`);
      }
    })();
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
  async #parserWorkflowFile(filePath: string) {
    const file = this.#workflowFileService.getFile(filePath);
    try {
      const data = await file.readOriginData();
      return data;
    } catch (error) {
      console.error(`${filePath}: ${errorFormatByNode(error)}`);
      return undefined;
    }
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
