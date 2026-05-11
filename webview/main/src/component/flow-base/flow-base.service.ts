import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';

import {
  ReactFlowInstance,
  Node,
  Edge,
  getOutgoers,
  getIncomers,
  getConnectedEdges,
  ReactFlowProps,
  IsValidConnection,
} from '@xyflow/react';
import Dagre from '@dagrejs/dagre';
import { maxBy, minBy } from 'lodash-es';
import { distance, min } from 'mathjs';
import { TrpcService } from '../../service/trpc.service';
import { deepEqual } from 'fast-equals';
import { debounceTime, filter, fromEvent, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClipboardKind, getCopy, setCopy } from '@fe/util/clipboard';
import { v4 } from 'uuid';
export interface ClipboardNodeData<N, E> {
  edges: E[];
  nodes: N[];
}
export const FlowDefaultConfig: Partial<ReactFlowProps> = {
  minZoom: 0.1,
  maxZoom: 3,
  reconnectRadius: 20,
  connectionRadius: 50,
  deleteKeyCode: ['Delete', 'Backspace'],
};
export const isValidConnection: IsValidConnection = (e) => {
  return e.source !== e.target;
};
@Injectable()
export class FlowBseService<NODE extends Node> {
  client = inject(TrpcService).client;
  instance = signal<ReactFlowInstance<NODE, any> | undefined>(undefined);
  nodes = signal<NODE[] | undefined>(undefined);
  /** 读取用 */
  nodes$ = computed(() => {
    return this.nodes() || [];
  });
  nodesObj$ = computed(() => {
    const obj: Record<string, NODE> = {};
    for (const item of this.nodes$()) {
      obj[item.id] = item;
    }
    return obj;
  });
  /** parentid 索引 */
  childNodeObj$ = computed(() => {
    const obj: Record<string, NODE[]> = {};
    for (const item of this.nodes$()) {
      if (!item.parentId) {
        continue;
      }
      obj[item.parentId] ??= [];
      obj[item.parentId].push(item);
    }
    return obj;
  });
  /** 是否是多节点 */
  isMultiList$ = computed(() => {
    return this.selectedNodeList$().length > 1;
  });
  edges = signal<Edge<any>[]>([]);
  setNodes = signal<React.Dispatch<React.SetStateAction<NODE[]>> | undefined>(
    undefined,
  );
  setEdges = signal<
    React.Dispatch<React.SetStateAction<Edge<any>[]>> | undefined
  >(undefined);
  configSelectedNodeList = computed(() => {
    return this.nodes()?.filter((item) => item.selected) || [];
  });
  isGlobal$$ = computed(() => {
    return !this.configSelectedNodeList().length;
  });
  selectNodeChanged$$ = computed(
    () => {
      return this.configSelectedNodeList().map((item) => item.id);
    },
    { equal: deepEqual },
  );
  selectedNodeList$ = signal<NODE[]>([], { equal: deepEqual });
  // todo 不知道是否用这个作为配置传参
  // selectedIdList = computed(
  //   () => {
  //     return this.configSelectedNodeList().map((node) => node.id);
  //   },
  //   { equal: deepEqual },
  // );
  clickedNode = signal<NODE | undefined>(undefined);

  contextmenuType = signal<'pane' | 'node' | 'selection'>('pane');
  nodeEvent$ = new Subject<{
    id: string;
    method: string;
    parameters?: any[];
    resolve: (value: any) => void;
  }>();
  /** 右键时的位置 */
  contextMenuPoint = signal({ x: 0, y: 0 });

  movedPosition$ = signal({ x: 0, y: 0 });
  sendEvent(id: string, method: string, parameters?: any[]) {
    const { promise, resolve } = Promise.withResolvers<any>();
    this.nodeEvent$.next({ id, method, parameters, resolve });
    return promise;
  }
  getLinkNodeList(node: NODE, type: 'source' | 'target') {
    if (type === 'source') {
      return getOutgoers(node, this.nodes$(), this.edges());
    } else {
      return getIncomers(node, this.nodes$(), this.edges());
    }
  }
  sourceNodeList = computed(() => {
    if (this.contextmenuType() !== 'node') {
      return [];
    }
    const item = this.selectedNodeList$()[0];
    if (!item) {
      return [];
    }
    return this.getLinkNodeList(item, 'source');
  });
  targetNodeList = computed(() => {
    if (this.contextmenuType() !== 'node') {
      return [];
    }
    const item = this.selectedNodeList$()[0];
    if (!item) {
      return [];
    }
    return this.getLinkNodeList(item, 'target');
  });

  deleteNode(nodes: { id: string }[]) {
    this.instance()!.deleteElements({ nodes: nodes });
  }

  deleteSelected() {
    const list = this.selectedNodeList$();
    this.deleteNode(list);
  }

  getNode(id: string) {
    return this.nodes$().find((item) => item.id === id);
  }

  moveTo(item: NODE | { id: string }) {
    const zoom = this.instance()?.getZoom();
    this.instance()!.fitView({
      nodes: [item],
      duration: 500,
      maxZoom: zoom,
      minZoom: zoom,
    });
  }
  /** 全量更新 */
  #updateNodes(list: Partial<NODE>[], full: boolean) {
    this.setNodes()!((nds) =>
      nds.map((node) => {
        for (const item of list) {
          if (node.id === item.id) {
            if (full) {
              return { ...item } as any;
            } else {
              return { ...node, ...item };
            }
          }
        }
        return node;
      }),
    );
  }
  /** 布局使用，用来插入和更新节点
   * 目前用来点击生成后布局
   */
  // updateOrInsertNodes(list: NODE[]) {
  //   this.setNodes()!((nds) => {
  //     let indexList = list.map((item) =>
  //       nds.findIndex((n) => n.id === item.id),
  //     );
  //     for (let i = 0; i < indexList.length; i++) {
  //       const matchIndex = indexList[i];
  //       if (matchIndex === -1) {
  //         nds.push(list[i]);
  //       } else {
  //         nds[matchIndex] = { ...list[i] };
  //       }
  //     }
  //     return nds;
  //   });
  // }
  /** 全量更新节点列表 */
  updateNodes(list: NODE[]) {
    return this.#updateNodes(list, true);
  }
  /** 增量更新节点列表 */
  patchNodes(list: Partial<NODE>[]) {
    return this.#updateNodes(list, false);
  }
  /** 全量更新节点 */
  updateNode(node: NODE) {
    return this.instance()!.updateNode(node.id!, node, {
      replace: true,
    });
  }
  /** 增量更新节点 */
  patchNode(node: Partial<NODE>) {
    return this.instance()!.updateNode(node.id!, (oldNode) => {
      return { ...oldNode, ...node };
    });
  }
  patchEdges(data: Partial<Edge>[]) {
    this.setEdges()!((list) =>
      list.map((node) => {
        for (const item of data) {
          if (node.id === item.id) {
            // if (full) {
            //   return { ...item } as any;
            // } else {
            return { ...node, ...item };
            // }
          }
        }
        return node;
      }),
    );
  }
  /** 更新节点的data，全量更新*/
  updateDataOne(node: Partial<NODE> & { id: string; data: NODE['data'] }) {
    this.instance()!.updateNodeData(node.id, node.data, {
      replace: true,
    });
  }
  /** 更新节点的data，增量更新  */
  patchDataOne(id: string, data: NODE['data'] | Record<string, any>) {
    this.instance()!.updateNodeData(id, (oldNode) => {
      return { ...(oldNode.data as any), ...data };
    });
  }
  /** 获得布局级别的后代 */
  getAllDescent(
    node: NODE,
    maxLevel: number,
    options?: { rankdir: string },
    level = 0,
    ancestorSet = new Set<string>(),
  ) {
    const list: NODE[] = [];
    const nodes = this.nodes$();
    const edges = this.edges();
    let outputList = getOutgoers(node, nodes, edges).filter(
      (item) => !ancestorSet.has(item.id),
    );
    if (options?.rankdir) {
      outputList = outputList.sort((a, b) => {
        switch (options.rankdir[0]) {
          case 'T':
          case 'B':
            return a.position.x - b.position.x;
          //布局从左到右.所以上下调整
          case 'L':
          case 'R':
            return a.position.y - b.position.y;
          default:
            return 0;
        }
      });
    }
    ancestorSet.add(node.id);
    level++;
    if (level === maxLevel) {
      return outputList;
    }
    for (const item of outputList) {
      list.push(item);
      list.push(
        ...this.getAllDescent(item, maxLevel, options, level, ancestorSet),
      );
    }
    return list;
  }

  /** 布局，不是对齐 */
  layoutNode(
    list: NODE[],
    options: { align?: string; rankdir: string },
    config: { level: number },
  ) {
    list = this.nodes$().filter((item) => list.some((a) => a.id === item.id));
    const edges = this.edges();
    for (const parent of list) {
      const allList = [
        parent,
        ...this.getAllDescent(parent, config.level, {
          rankdir: options?.rankdir ?? 'LR',
        }),
      ];
      const idList = allList.map((item) => item.id);
      const connectedEdges = getConnectedEdges(allList, edges).filter(
        (item) => idList.includes(item.source) && idList.includes(item.target),
      );
      const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
      g.setGraph({
        rankdir: options?.rankdir,
        align: options?.align,
      });

      allList.forEach((item, index) => {
        g.setNode(item.id, {
          width: item.measured?.width || 0,
          height: item.measured?.height || 0,
          label: `${index}`,
        });
      });
      const indexObject = allList.reduce(
        (obj, item, index) => {
          obj[item.id] = index;
          return obj;
        },
        {} as Record<string, any>,
      );
      connectedEdges
        .sort((a, b) => {
          const v1 = indexObject[a.source] - indexObject[b.source];
          if (!v1) {
            return indexObject[a.target] - indexObject[b.target];
          }
          return v1;
        })
        .forEach((item) => {
          g.setEdge(item.source, item.target);
        });
      // 位置+宽度平均值+间隙=下一个的位置
      Dagre.layout(g, {});
      let changedNode;
      const changedList = [];
      for (let i = 0; i < allList.length; i++) {
        const item = allList[i];
        const pos = g.node(item.id);
        if (i === 0) {
          changedNode = {
            x: pos.x - item.measured!.width! / 2,
            y: pos.y - item.measured!.height! / 2,
          };
        } else {
          item.position = {
            x:
              parent.position.x +
              pos.x -
              (item.measured?.width || 0) / 2 -
              changedNode!.x,

            y:
              parent.position.y +
              pos.y -
              (item.measured?.height || 0) / 2 -
              changedNode!.y,
          };
          changedList.push(item);
        }
      }
      this.updateNodes(changedList);

      // 之支持一个
      break;
    }
  }

  /** 对齐 */
  nodeAlign(position: string) {
    const selectNodeList = this.selectedNodeList$();
    const list = this.nodes$().filter((item) =>
      selectNodeList.some((a) => a.id === item.id),
    );

    switch (position) {
      case 'left':
        {
          const value = minBy(list, (item) => item.position.x);
          for (const item of list) {
            this.patchNode({
              id: item.id,
              position: { x: value!.position!.x!, y: item.position.y },
            } as Partial<NODE>);
          }
        }
        break;
      case 'right':
        {
          const value = maxBy(
            list,
            (item) => item.position.x + item.measured!.width!,
          );

          for (const item of list) {
            this.patchNode({
              id: item.id,
              position: {
                x:
                  value!.position!.x! +
                  value!.measured!.width! -
                  item.measured!.width!,
                y: item.position.y,
              },
            } as Partial<NODE>);
          }
        }
        break;
      case 'top':
        {
          const value = minBy(list, (item) => item.position.y);
          for (const item of list) {
            this.patchNode({
              id: item.id,
              position: { y: value!.position!.y!, x: item.position.x },
            } as Partial<NODE>);
          }
        }
        break;
      case 'bottom':
        {
          const value = maxBy(
            list,
            (item) => item.position.y + item.measured!.height!,
          );
          for (const item of list) {
            this.patchNode({
              id: item.id,
              position: {
                y:
                  value!.position!.y! +
                  value!.measured!.height! -
                  item.measured!.height!,
                x: item.position.x,
              },
            } as Partial<NODE>);
          }
        }
        break;

      default:
        break;
    }
  }
  getNearestNode(position: [number, number], list: NODE[]) {
    return minBy(
      list.map((item) => {
        return { item, distance: this.pointToRect(position, item) };
      }),
      (item) => item.distance,
    )!.item;
  }
  getNodeRect(node: NODE) {
    let currentNode = node;
    const offset = { x: node.position.x, y: node.position.y };
    while (currentNode.parentId) {
      currentNode = this.nodesObj$()[currentNode.parentId];
      offset.x += currentNode.position.x;
      offset.y += currentNode.position.y;
    }
    return {
      ...offset,
      width: node.measured!.width!,
      height: node.measured!.height!,
    };
  }
  pointToRect(position: [number, number], node: NODE) {
    {
      const data = this.getNodeRect(node);
      return min(
        distance(position, [data.x, data.y]),
        distance(position, [data.x, data.y + data.height]),
        distance(position, [data.x + data.width, data.y]),
        distance(position, [data.x + data.width, data.y + data.height]),
      );
    }
  }
  #findAllAncestor(id: string): string[] {
    const parentId = this.nodesObj$()[id].parentId;
    if (parentId) {
      return [parentId, ...this.#findAllAncestor(parentId)];
    }
    return [];
  }
  findNodeLevel(id: string) {
    return [id, ...this.#findAllAncestor(id)].reduce(
      (obj, item, i) => {
        obj[item] = i + 1;
        return obj;
      },
      {} as Record<string, number>,
    );
  }
  parentAutoResize(
    node: NODE,
    nodeLevelObject: Record<string, number>,
    ancestorNode: NODE,
  ) {
    const level = nodeLevelObject[ancestorNode.id];
    if (typeof level !== 'number') {
      return ancestorNode;
    }
    const parentBox = this.getNodeRect(ancestorNode);
    // 父级自动扩容，需要多级同时扩容
    const width =
      Math.max(
        parentBox.x + parentBox.width,
        node.position.x + (node.measured?.width! || node.width! || 0),
      ) -
      parentBox.x +
      16 * level;
    const height =
      Math.max(
        parentBox.y + parentBox.height,
        node.position.y + (node.measured?.height! || node.height! || 0),
      ) -
      parentBox.y +
      16 * level;
    ancestorNode.width = width;
    ancestorNode.height = height;
    return { ...ancestorNode };
  }
  setClipboard(kind: ClipboardKind, destroyRef: DestroyRef) {
    const keyDownOb = fromEvent<KeyboardEvent>(
      window.document.body,
      'keydown',
    ).pipe(debounceTime(50), takeUntilDestroyed(destroyRef));

    keyDownOb
      .pipe(filter((event) => event.ctrlKey === true && event.code === 'KeyC'))
      .subscribe(async (event) => {
        if (
          window.document.activeElement !== window.document.body &&
          window.document.activeElement?.classList.contains('react-flow__node')
        ) {
          this.copyNodes(kind);
        }
      });
    keyDownOb
      .pipe(filter((event) => event.ctrlKey === true && event.code === 'KeyV'))
      .subscribe(async (event) => {
        if (window.document.activeElement === window.document.body) {
          const result = await this.#pasteNodes(kind, this.movedPosition$());
          if (result) {
            event.stopPropagation();
            event.preventDefault();
          }
        }
      });
  }
  async copyNodes(kind: ClipboardKind, selected?: boolean) {
    const selectedNodes = selected
      ? this.nodes$().filter((item) => item.selected)
      : this.selectedNodeList$();

    if (!selectedNodes.length) {
      return;
    }
    const selectedObj = selectedNodes.reduce(
      (obj, item) => {
        obj[item.id] = item;
        return obj;
      },
      {} as Record<string, NODE>,
    );
    const selectedEdges = this.edges().filter(
      (item) => selectedObj[item.source] && selectedObj[item.target],
    );

    await setCopy(kind, {
      nodes: selectedNodes,
      edges: selectedEdges,
    });
  }
  async pasteNodesByContextMenu(kind: ClipboardKind) {
    return this.#pasteNodes(kind, this.contextMenuPoint());
  }
  async #pasteNodes(kind: ClipboardKind, position: { x: number; y: number }) {
    const result = await getCopy<ClipboardNodeData<NODE, Edge<any>>>(kind);
    if (!result) {
      return false;
    }
    const nodeIdMap = {} as Record<string, string>;
    const minPos = this.#getMinPosition(result.nodes);
    const currentPosition = this.instance()!.screenToFlowPosition(position);
    for (const node of result.nodes) {
      const id = v4();
      nodeIdMap[node.id] = id;
      node.id = id;
      node.position = {
        x: node.position.x - minPos.x + currentPosition.x,
        y: node.position.y - minPos.y + currentPosition.y,
      };
      node.selected = false;
    }
    for (const edge of result.edges) {
      edge.id = v4();
      if (nodeIdMap[edge.source] && nodeIdMap[edge.target]) {
        edge.source = nodeIdMap[edge.source];
        edge.target = nodeIdMap[edge.target];
      }
    }
    this.instance()!.addNodes(result.nodes);
    this.instance()!.addEdges(result.edges);
    return true;
  }

  #getMinPosition(elements: NODE[]) {
    const pointList = elements.map((item) => {
      return item.position;
    });
    const x = minBy(pointList, (item) => item.x)!.x;
    const y = minBy(pointList, (item) => item.y)!.y;
    return { x, y };
  }
}
