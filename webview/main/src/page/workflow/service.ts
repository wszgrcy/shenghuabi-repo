import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { Node } from '@xyflow/react';
import { CustomNode } from './type';
import { v4, v5 } from 'uuid';
import { wrapControlNode } from './custom-node/wrap-node';
import { IterationStartNodeDefine } from './custom-node/iteration-start-node';
import { IterationNodeDefine } from './custom-node/iteration-node';
import { FlowBseService } from '../../component/flow-base/flow-base.service';
import {
  deepClone,
  HandleNode,
  UUID_NS,
  WebviewNodeConfig,
} from '@bridge/share';
import { deepEqual } from 'fast-equals';
import { FormlyCommonNodeComponent } from './custom-node/formly-common-node/component';
import { isTruthy } from '@share/util/is-truthy';
import { DefaultNodeComponent } from './custom-node/default/component';
import { ChatNodeService } from '../../domain/chat-node/chat-node.service';
@Injectable()
export class BridgeService extends FlowBseService<CustomNode> {
  #injector = inject(Injector);
  #chatNode = inject(ChatNodeService);

  #nodeObject$$ = computed(() => {
    return this.#chatNode.nodeList$().reduce(
      (obj, item) => {
        obj[item.type] = item;
        return obj;
      },
      {} as Record<string, WebviewNodeConfig>,
    );
  });
  #pluginNodeObject$$ = computed(() => {
    return this.#chatNode.pluginNodeList$().reduce(
      (obj, item) => {
        obj[item.type] = item;
        return obj;
      },
      {} as Record<string, WebviewNodeConfig>,
    );
  });
  fullNodeObject$$ = computed(() => {
    return { ...this.#nodeObject$$(), ...this.#pluginNodeObject$$() };
  });
  #nodeTypes$$ = computed(() => {
    return this.#chatNode.nodeList$().reduce(
      (obj, item) => {
        obj[item.type] = wrapControlNode(
          {
            component: item.component ?? FormlyCommonNodeComponent,
            otherInputs: item.displayConfig
              ? {
                  define: item.displayConfig,
                }
              : {},
          },
          this,
        );
        return obj;
      },
      {} as Record<string, ReturnType<typeof wrapControlNode>>,
    );
  });
  #pluginNodeTypes$$ = computed(() => {
    return this.#chatNode.pluginNodeList$().reduce(
      (obj, item) => {
        obj[item.type] = wrapControlNode(
          {
            component: item.component ?? FormlyCommonNodeComponent,
            otherInputs: item.displayConfig
              ? {
                  define: item.displayConfig,
                }
              : {},
          },
          this,
        );
        return obj;
      },
      {} as Record<string, ReturnType<typeof wrapControlNode>>,
    );
  });
  #defaultNode$$ = computed(() => {
    return wrapControlNode(
      {
        component: DefaultNodeComponent,
      },
      this,
    );
  });
  nodeTypeList$ = signal<string[]>([], { equal: deepEqual });
  #defaultNodeObj$$ = computed(() => {
    return this.nodeTypeList$().reduce(
      (obj, item) => {
        obj[item] = this.#defaultNode$$();
        return obj;
      },
      {} as Record<string, any>,
    );
  });
  fullNodeTypes$$ = computed(() => {
    return {
      ...this.#defaultNodeObj$$(),
      ...this.#nodeTypes$$(),
      ...this.#pluginNodeTypes$$(),
    };
  });
  nodeDisplayList$$ = computed(() => {
    return this.#chatNode
      .nodeList$()
      .map((item) => {
        if (item.label && item.icon) {
          return {
            label: item.label,
            value: item.type,
            icon: item.icon!,
            color: item.color!,
          };
        }
        return undefined;
      })
      .filter(isTruthy);
  });
  pluginDisplayList$$ = computed(() => {
    return this.#chatNode
      .pluginNodeList$()
      .map((item) => {
        if (item.label && item.icon) {
          return {
            label: item.label,
            value: item.type,
            icon: item.icon!,
            color: item.color!,
          };
        }
        return undefined;
      })
      .filter(isTruthy);
  });
  constructor() {
    super();
  }

  appendNode(position: { x: number; y: number }, config: Partial<CustomNode>) {
    const position2 = this.instance()!.screenToFlowPosition(position);
    const maybeParent = this.selectedNodeList$()[0];
    let parentConfig;
    if (
      this.contextmenuType() === 'node' &&
      maybeParent &&
      maybeParent.type === IterationNodeDefine.type
    ) {
      const parentBox = this.getNodeRect(maybeParent);
      if (
        parentBox.x <= position2.x &&
        parentBox.x + parentBox.width! >= position2.x &&
        parentBox.y <= position2.y &&
        parentBox.y + parentBox.height! >= position2.y
      ) {
        parentConfig = {
          extent: maybeParent ? 'parent' : undefined,
          parentId: maybeParent ? maybeParent.id : undefined,
          position: {
            x: position2.x - parentBox.x,
            y: position2.y - parentBox.y,
          },
        };
        const nodeLevelObject = this.findNodeLevel(maybeParent.id);
        const nodeData = {
          id: v4(),
          ...config,
          ...parentConfig,
        } as CustomNode;
        const cNode = { position: position2, ...config } as CustomNode;
        this.setNodes()!((list) => {
          return list
            .map((item) => {
              return this.parentAutoResize(cNode, nodeLevelObject, item);
            })
            .concat(nodeData);
        });
        return nodeData;
      }
    }

    const nodeData = {
      position: position2,
      id: v4(),
      ...config,
    } as CustomNode;
    this.setNodes()!((list) => {
      return list.concat(nodeData as any);
    });
    return nodeData;
  }

  getNodeTitle = (node: CustomNode) => {
    return `${this.fullNodeObject$$()[node.type!].label}-${
      node.data.title || ''
    }`;
  };

  /**
   * 后代判定
   *  用于判断要当作的父级的节点是不是他的子级，防止循环 */
  #assertContainerDescendant(parentId: string, maybeChildId: string): boolean {
    const maybeChild = this.nodesObj$()[maybeChildId];
    if (maybeChild.parentId === parentId) {
      return true;
    } else if (maybeChild.parentId) {
      return this.#assertContainerDescendant(parentId, maybeChild.parentId);
    }
    return false;
  }

  #findAllDragList(id: string): string[] {
    return [
      id,
      ...(this.childNodeObj$()[id] || []).flatMap((item) =>
        this.#findAllDragList(item.id),
      ),
    ];
  }

  #findAllDescendantLevel(
    id: string,
    parentObjList: Record<string, Node[]>,
    level = 1,
  ): Record<string, { level: number; node: Node }> {
    const obj = parentObjList[id] || [];
    return {
      [id]: { level, node: this.nodesObj$()[id] },
      ...obj.reduce(
        (obj, item) => {
          return {
            ...obj,
            ...this.#findAllDescendantLevel(item.id, parentObjList, level + 1),
          };
        },
        {} as Record<string, { level: number; node: Node }>,
      ),
    };
  }
  // todo 是否节流减少计算
  drag(/** 拖动节点 */ node: Node, type: string) {
    if (node.extent) {
      return;
    }
    const list = this.instance()!
      .getIntersectingNodes(node)
      .filter((item) => item.type === IterationNodeDefine.type);
    let matched = false;
    let parentNode: Node | undefined;
    if (list.length) {
      matched = true;
      parentNode = this.getNearestNode(
        [node.position.x, node.position.y],
        list,
      );
      if (this.#assertContainerDescendant(node.id, parentNode.id)) {
        parentNode = undefined;
        matched = false;
      }
    }

    this.setNodes()!((list) => {
      let newList = list.map((item) => {
        if (!matched) {
          item.className = '';
        } else if (parentNode!.id === item.id) {
          if (type === 'drag') {
            item.className = 'drag-hover';
          } else if (type === 'dragStop') {
            item.className = '';
          }
        } else {
          item.className = '';
        }

        return { ...item };
      });

      if (type === 'dragStop' && parentNode) {
        const parentObj = this.findNodeLevel(parentNode.id);
        const idToIndex: Record<string, number> = {};
        newList = newList.map((item, index) => {
          idToIndex[item.id] = index;
          if (item.id === node.id) {
            const parentBox = this.getNodeRect(parentNode);
            item.position = {
              x: node.position.x - parentBox.x,
              y: node.position.y - parentBox.y,
            };
            item.extent = 'parent';
            item.parentId = parentNode.id;
            return { ...item };
          } else {
            return this.parentAutoResize(node, parentObj, item);
          }
        });

        const dragList = this.#findAllDragList(node.id);
        const removeList = dragList
          .map((id) => idToIndex[id])
          .sort((a, b) => b - a);
        const idToObject: Record<string, Node> = {};
        removeList.forEach((indexItem) => {
          const [deleteNode] = newList.splice(indexItem, 1);
          idToObject[deleteNode.id] = deleteNode;
        });
        dragList.forEach((id) => {
          newList.push(idToObject[id]);
        });
      }
      return newList;
    });
  }
  canUnwrap = computed(() => {
    const selectNodeList = this.selectedNodeList$();
    if (selectNodeList.length !== 1) {
      return false;
    }
    const item = selectNodeList[0];
    if (item.type === IterationStartNodeDefine.type) {
      return false;
    }
    if (item.extent) {
      return true;
    }
    return !!item.extent;
  });
  canDelete = computed(() => {
    const selectNodeList = this.selectedNodeList$();
    if (selectNodeList.length !== 1) {
      return false;
    }
    const item = selectNodeList[0];

    return item.type !== IterationStartNodeDefine.type;
  });

  unWrap() {
    const id = this.selectedNodeList$()[0].id;
    const parentId = this.selectedNodeList$()[0].parentId;
    this.instance()!.setNodes((list) => {
      /** 父级索引 */
      const parentNode = list.find((item, index) => {
        return parentId === item.id;
      });
      if (!parentNode) {
        throw new Error('解除父级异常');
      }
      return list.map((item) => {
        if (item.id === id) {
          item.parentId = undefined;
          item.extent = undefined;
          const parentReact = this.getNodeRect(parentNode);
          item.position = {
            x: item.position.x + parentReact.x,
            y: item.position.y + parentReact.y,
          };
          return { ...item };
        }
        return item;
      });
    });
  }
  async handleChange(
    id: string,
    direction: 'input' | 'output',
    index: number,
    changeFn: () => Promise<Omit<HandleNode, 'id'>[] | undefined>,
    autoUpdate = false,
  ) {
    const node = this.getNode(id)!;
    const result = await changeFn();
    if (result) {
      const handle = deepClone(node.data.handle || { input: [], output: [] });
      handle[direction][index] = result.map((item, j) => {
        return {
          ...item,
          id: v5(item.value, UUID_NS),
        };
      });
      if (autoUpdate && !deepEqual(handle, node.data.handle)) {
        this.patchDataOne(id, { handle: handle });
      }
      return handle[direction];
    }
    return;
  }

  context = inject(ChatNodeService).context;
}
