import {
  computed,
  effect,
  inject,
  Injectable,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import {
  Edge,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  Position,
} from '@xyflow/react';
import { CustomNode } from './custom-node/type';
import { v4 } from 'uuid';
import { randomColor } from '../../util/random';

import { FlowBseService } from '../../component/flow-base/flow-base.service';
import { REVERSE_POSITION_MAP } from './custom-node/wrap-node';
import { effectOnce } from '@fe/util/effect-once';
import {
  CardDataType,
  CardMindNode,
  ChatDefaultDefine,
  ContainerMindNode,
  ContentCardDefaultDefine,
  deepClone,
  DrawDefaultDefine,
  DrawMindNode,
  FullCardDefaultDefine,
  ImageDefaultDefine,
  MindNode,
  NodeEdgeConfigType,
  STYLE_Transformer,
} from '@bridge/share';
import { getConfigFromOptionConfig } from './config/util';
import { defaultsDeep, uniqBy } from 'lodash-es';
import { deepEqual } from 'fast-equals';
import { filter, shareReplay, startWith, Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { BuildNodeData, CARD_IMPORT_TYPE } from '../../type-define/mind-node';

import { cardDomConvertList } from './node-convert/dom-to-text-group';
import { mdToTextGroup } from './node-convert/md-to-text-group';
import { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import { SerializedHeadingNode } from '@lexical/rich-text';
import {
  createLexicalLiSerialNode,
  createLexicalText,
  createLexicalUlSerialNode,
} from './node-convert/lexical-create-serial-node';
import * as v from 'valibot';
import { getDefaults } from '@piying/view-angular-core';
import { WebViewGlobalConfigDefine } from './config/define';
import { omitDeepBy } from '@fe/util/deep-omit';
import {
  SerializedCustomLinkNode,
  SerializedImageNode,
} from '@cyia/component/editor';
@Injectable()
export class BridgeService extends FlowBseService<MindNode> {
  id$ = signal<string | undefined>(undefined);

  /** 只有点击生成开始有用 */
  targetClick$ = signal<
    { id: string; handleId: string; position: Position } | undefined
  >(undefined);
  #injector = inject(Injector);
  globalConfig = signal(getDefaults(WebViewGlobalConfigDefine));
  globalStyle$ = computed(
    () => {
      return v.parse(STYLE_Transformer, this.globalConfig().data.style);
    },
    { equal: deepEqual },
  );
  flowConfig$ = computed(
    () => {
      return this.globalConfig().flow;
    },
    { equal: deepEqual },
  );
  drawNodeChange$ = new Subject<{
    value: undefined | DrawMindNode;
    type: 'change' | 'end';
    source: 'add' | 'change' | 'restore' | 'end';
  }>();

  /** 用来监听恢复状态,双击编辑,普通新建 */
  drawNodeChange$$ = this.drawNodeChange$.pipe(shareReplay(1));
  /** 当前的编辑状态 */
  drawNodeEditStatus$$ = this.drawNodeChange$$.pipe(
    filter((item) => item.source !== 'restore'),
    startWith({ value: undefined, type: 'end', source: 'end' }),
  );
  /** 用来保存时获取状态 */
  drawNodeEditStatus$ = toSignal(this.drawNodeEditStatus$$);
  constructor() {
    super();
    this.drawNodeChange$$.subscribe();
  }
  listen() {
    effect(
      () => {
        this.clickAddNode();
      },
      { injector: this.#injector },
    );
  }

  wrapSupport$ = computed(() => {
    return !this.selectedNodeList$().some((item) => item.type === 'container');
  });
  isCard$ = computed(() => {
    const list = this.selectedNodeList$();
    return (
      list.length === 1 &&
      list[0].type === 'card' &&
      list[0].data.status?.open !== 'content'
    );
  });
  wrapNode() {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    const selectedList = this.selectedNodeList$();
    for (const item of selectedList) {
      left = Math.min(item.position.x, left);
      top = Math.min(item.position.y, top);
      right = Math.max(item.position.x + (item.measured!.width || 0), right);
      bottom = Math.max(item.position.y + (item.measured!.height || 0), bottom);
    }
    const color = randomColor();
    const BorderStyle = {
      color: color + '66',
      width: 1,
      style: 'solid',
      radius: 4,
    };
    const newNode = {
      id: v4(),
      position: {
        x: left - 16,
        y: top - 16,
      },
      height: bottom - top + 32,
      width: right - left + 32,

      // todo 样式
      data: {
        group: true,
        style: {
          main: {
            border: {
              enable: true,
              value: {
                left: BorderStyle,
                right: BorderStyle,
                top: BorderStyle,
                bottom: BorderStyle,
              },
            },
            background: {
              enable: true,
              value: {
                backgroundColor: color + '33',
              },
            },
          },
        },
      },
      type: 'container',
    } as ContainerMindNode;

    selectedList.forEach((item) => {
      item.extent = 'parent';
      item.parentId = newNode.id;
      item.position = {
        x: item.position.x - left + 16,
        y: item.position.y - top + 16,
      };
    });
    this.instance()!.setNodes((list) => {
      for (const item of selectedList) {
        const index = list.findIndex((node) => node.id === item.id);
        if (index !== -1) {
          list[index] = item;
        }
      }
      return [newNode, ...list];
    });
  }
  unWrapNode() {
    const id = this.selectedNodeList$()[0].id;
    this.instance()!.setNodes((list) => {
      const index = list.findIndex((item, index) => {
        return id === item.id;
      });
      if (index == -1) {
        return list;
      }
      const node = list[index];
      list.splice(index, 1);
      return list.map((item) => {
        if (item.parentId === id) {
          item.parentId = undefined;
          item.extent = undefined;
          item.position = {
            x: item.position.x + node.position.x,
            y: item.position.y + node.position.y,
          };
          return { ...item };
        }
        return item;
      });
    });
  }

  appendNode(position: { x: number; y: number }, config: any) {
    this.instance()!.addNodes({
      position: this.instance()!.screenToFlowPosition(position),
      id: v4(),
      ...config,
    });
  }
  /** 右键加节点使用 */
  async appendNodeUseContextMenuPoint(type: string, options?: any) {
    this.instance()!.addNodes({
      position: this.instance()!.screenToFlowPosition(this.contextMenuPoint()),
      id: v4(),
      ...(await this.getDefaultConfig(type, options)),
      type: type as any,
    } as any);
  }

  getNodeTitle(node: CustomNode) {
    switch (node.type) {
      case 'chat':
        return `对话-${node.data['title'] || ''}`;
      case 'card':
        return `卡片-${node.data['title'] || ''}`;
      case 'image':
        return `图片`;
      default:
        break;
    }
    return '';
  }
  clickAddNode() {
    const data = this.targetClick$();
    if (!data) {
      return;
    }
    setTimeout(() => {
      untracked(async () => {
        const edges = getConnectedEdges([{ id: data.id } as any], this.edges());
        if (
          edges.some((item) => item.targetHandle === `${data.position}-target`)
        ) {
          return;
        }
        const reversePosition = REVERSE_POSITION_MAP[data.position];
        const [connectNode] = getIncomers(data, this.nodes$(), edges);
        const edge = edges.find((item) => connectNode?.id === item.source);
        const targetHandle = edge
          ? edge.targetHandle!
          : `${Position.Left}-target`;
        /** 当前节点已经连接的位置 */
        const connectPosition = targetHandle.split('-')[0];
        const currentNode = this.getNode(data.id)!;

        // 方向相反为子级
        if (connectPosition === reversePosition) {
          const newNode: MindNode = {
            id: v4(),
            type: currentNode.type,
            position: { ...currentNode.position },
            ...(await this.getDefaultConfig(currentNode.type!, {
              open: (currentNode as any).data['status']?.['open'],
            })),
          } as any;
          const newEdge: Edge = this.getEdgeConfig(currentNode.data.edge, {
            id: v4(),
            source: currentNode.id,
            target: newNode.id,
            sourceHandle: `${data.position}-source`,
            targetHandle: `${reversePosition}-target`,
            hidden: true,
          });

          this.setNodes()!((list) => {
            return list.concat(newNode);
          });
          this.setEdges()!((list) => {
            return list.concat(newEdge);
          });
          effectOnce(
            () => {
              const node = this.getNode(newNode.id);
              if (!node || !node.measured?.height || !node.measured?.width) {
                return false;
              }
              return node;
            },
            (node) => {
              setTimeout(() => {
                this.layoutNode(
                  [currentNode],
                  this.getLayoutConfig(currentNode.data.layout),
                  {
                    level: 9999,
                  },
                );
                this.setEdges()!((list) => {
                  return list.map((item) => {
                    if (item.id === newEdge.id) {
                      return { ...item, hidden: false };
                    }
                    return item;
                  });
                });
              }, 50);
            },
            this.#injector,
          );
        } else if (connectNode) {
          let offset!: { x: number; y: number };
          if (data.position === Position.Left) {
            offset = { x: -1, y: 0 };
          } else if (data.position === Position.Right) {
            offset = { x: 1, y: 0 };
          } else if (data.position === Position.Top) {
            offset = { y: -1, x: 0 };
          } else if (data.position === Position.Bottom) {
            offset = { y: 1, x: 0 };
          }
          const newNode: MindNode = {
            id: v4(),
            type: currentNode.type,
            position: {
              x: offset.x + currentNode.position.x,
              y: offset.y + currentNode.position.y,
            },
            ...(await this.getDefaultConfig(currentNode.type!, {
              open: (currentNode as any).data['status']?.['open'],
            })),
          } as any;
          const newEdge: Edge = this.getEdgeConfig(currentNode.data.edge, {
            id: v4(),
            source: connectNode.id,
            target: newNode.id,
            sourceHandle: !edge
              ? `${Position.Right}-source`
              : edge.sourceHandle,
            targetHandle: targetHandle,
            hidden: true,
          });
          this.setNodes()!((list) => {
            return list.concat(newNode);
          });
          this.setEdges()!((list) => {
            return list.concat(newEdge);
          });
          effectOnce(
            () => {
              const node = this.getNode(newNode.id);
              if (!node || !node.measured?.height || !node.measured?.width) {
                return false;
              }
              return node;
            },
            (node) => {
              setTimeout(() => {
                this.layoutNode(
                  [connectNode as MindNode],
                  this.getLayoutConfig((connectNode as MindNode).data.layout),

                  {
                    level: 9999,
                  },
                );
                this.setEdges()!((list) => {
                  return list.map((item) => {
                    if (item.id === newEdge.id) {
                      return { ...item, hidden: false };
                    }
                    return item;
                  });
                });
              }, 50);
            },
            this.#injector,
          );
        }
      });
    }, 0);
  }
  /** 把全局的edge配置合并了 */
  getEdgeConfig(
    edgeData: NodeEdgeConfigType | undefined,
    edge: Partial<Edge>,
  ): Edge {
    const nodeConfig: Partial<Edge> = getConfigFromOptionConfig(edgeData, [
      'style',
      'markerEnd',
    ]);
    const globalConfig: Partial<Edge> = getConfigFromOptionConfig(
      this.globalConfig().data.edge,
      ['style', 'markerEnd'],
    );
    const obj = defaultsDeep({}, nodeConfig, globalConfig);
    if (obj.markerEnd) {
      if (obj.style?.stroke) {
        obj.markerEnd ??= {};
        (obj.markerEnd! as any).color ||= obj.style?.stroke;
      }
      if (obj.style?.strokeWidth) {
        obj.markerEnd ??= {};
        (obj.markerEnd! as any).strokeWidth ||= obj.style?.strokeWidth;
      }
    }
    obj.interactionWidth = (obj.style?.strokeWidth || 0) + 2;
    const merged = {
      ...edge,
      ...deepClone(obj),
    };
    if (
      !edgeData?.['markerEnd']?.enable &&
      !this.globalConfig().data.edge?.['markerEnd']?.enable
    ) {
      delete merged['markerEnd'];
    }
    if (
      !edgeData?.['style']?.enable &&
      !this.globalConfig().data.edge?.['style']?.enable
    ) {
      delete merged['style'];
    }
    return merged;
  }
  getLayoutConfig(data: any) {
    return defaultsDeep({}, data, this.globalConfig().data.layout);
  }
  /** 批量构建节点 */
  async batchBuildNode(
    input: { root: string | undefined; data: BuildNodeData },
    node: MindNode,
  ) {
    const nodeMap = new Map<
      string,
      { node: MindNode; relations: CARD_IMPORT_TYPE['relations'] }
    >();
    const textNodeMap = new WeakMap<
      ReturnType<typeof mdToTextGroup>[number],
      MindNode
    >();
    const edgeList: Edge[] = [];
    const textNodeList: MindNode[] = [];
    let index = 0;
    for (const item of input.data.list) {
      let content: string;
      if (item.contentPath) {
        content = await this.client.assets.loadFileText.query({
          localPath: item.contentPath,
          root: input.root,
        });
      } else {
        content = item.content!;
      }
      // fixme 用来修复编辑器只支持4个长度空格的md列表缩进
      content = content.replace(/^([ ]+)-/gm, (str, m1) => {
        return `    `.repeat((m1.length / 2) | 0) + '-';
      });
      if (item.type === 'card') {
        const defaultConfig = await this.getDefaultConfig('card');
        const newNode = {
          id: v4(),
          position: {
            x: node.position.x + node.measured!.width! + 50,
            y: node.position.y,
          },
          type: 'card',
          ...defaultConfig,
          data: defaultsDeep(
            {
              title: item.title,
              value: {
                markdown: content,
                markdownRoot: input.root,
              },
            },
            defaultConfig?.data,
          ),
        } as MindNode;
        nodeMap.set(item.title || `未命名${index++}`, {
          node: newNode,
          relations: item.relations,
        });
      } else if (item.type === 'text') {
        const list = mdToTextGroup(content);
        while (list.length) {
          const defaultConfig = await this.getDefaultConfig('card', {
            open: 'content',
          });
          const item = list.shift()!;
          const newNode = {
            id: v4(),
            position: {
              x: node.position.x + node.measured!.width! + 50,
              y: node.position.y,
            },
            type: 'card',
            ...defaultConfig,
            data: {
              ...defaultConfig?.data,
              value: { markdown: await item.toData(this) },
            },
          } as MindNode;
          textNodeList.push(newNode);
          textNodeMap.set(item, newNode);
          if (item.children.length) {
            list.push(...item.children);
          }
          if (item.parent) {
            const parentNode = textNodeMap.get(item.parent)!;
            edgeList.push(
              this.getEdgeConfig(node.data.edge, {
                id: v4(),
                source: parentNode.id,
                sourceHandle: 'right-source',
                target: newNode.id,
                targetHandle: 'left-target',
              }),
            );
          } else {
            edgeList.push(
              this.getEdgeConfig(node.data.edge, {
                id: v4(),
                source: node.id,
                sourceHandle: 'right-source',
                target: newNode.id,
                targetHandle: 'left-target',
              }),
            );
          }
        }
      }
    }
    nodeMap.forEach((value, key) => {
      edgeList.push(
        this.getEdgeConfig(node.data.edge, {
          id: v4(),
          source: node.id,
          sourceHandle: 'right-source',
          target: value.node.id,
          targetHandle: 'left-target',
        }),
      );
      value.relations.forEach((relation) => {
        const node = nodeMap.get(relation.to || relation.from!);
        if (!node) {
          return;
        }
        const source = relation.to ? value.node : node.node;
        const target = relation.to ? node.node : value.node;
        edgeList.push(
          this.getEdgeConfig(source.data.edge, {
            id: v4(),
            source: source.id,
            sourceHandle: 'right-source',
            target: target.id,
            targetHandle: 'left-target',
            label: relation.label,
          }),
        );
      });
    });
    this.setNodes()!((list) => {
      return list.concat(
        [...nodeMap.values()].map((item) => item.node),
        textNodeList,
      );
    });
    this.setEdges()!((list) => {
      return list.concat(edgeList);
    });
  }
  /** 把子节点的父节点找到并加入 */
  containerReplaceSubNode(props: MindNode, list: MindNode[]) {
    const containerList = new Set<string>();
    const originList = list.slice();
    for (let index = 0; index < list.length; index++) {
      const item = list[index];
      if (item.parentId) {
        if (item.parentId !== props.parentId) {
          containerList.add(item.parentId);
        } else {
          return originList;
        }
      }
    }
    return list.concat([...containerList].map((id) => this.nodesObj$()[id]));
  }
  /** 文本组,图片组转卡片 */
  async textGroupToCard() {
    const point = this.contextMenuPoint();
    const list = this.selectedNodeList$();
    let allList = [];
    const excludeSet = new Set<string>();
    for (const item of list) {
      if (excludeSet.has(item.id)) {
        continue;
      }
      allList.push(
        item,
        ...this.getAllDescent(list[0], 99999, undefined, undefined, excludeSet),
      );
    }
    allList = uniqBy(allList, (item) => item.id);
    /** 完成的列表 */
    const finalList: TMP_NODE_ITEM[] = [];
    const completeSet = new Set<string>();
    const edges = this.edges();
    for (const item of allList) {
      if (completeSet.has(item.id)) {
        continue;
      }
      const newNode: TMP_NODE_ITEM = new TMP_NODE_ITEM(item.id, item);

      const list = [
        { parentNode: newNode, children: getOutgoers(item, allList, edges) },
      ];
      finalList.push(newNode);
      while (list.length) {
        const childItem = list.pop()!;
        completeSet.add(childItem.parentNode.id);
        for (const child of childItem.children) {
          //todo 反向问题 需要保证没有这个节点,否则不显示相关
          const existIndex = finalList.findIndex(
            (item) => item.id === child.id,
          );
          if (existIndex === -1) {
            const newItem: TMP_NODE_ITEM = new TMP_NODE_ITEM(child.id, child);

            list.push({
              parentNode: newItem,
              children: getOutgoers(child, allList, edges),
            });
            childItem.parentNode.children.push(newItem);
          } else {
            finalList.splice(existIndex, 1);
            childItem.parentNode.children.push(finalList[existIndex]);
          }
        }
      }
    }
    const defaultNode = await this.getDefaultConfig('card');
    const newNode = {
      ...defaultNode,
      type: 'card',
      data: {
        ...defaultNode.data,
        value: {
          editorState: {
            root: {
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
              children: finalList.flatMap((item) => item.toNode().flat()),
            },
          } as SerializedEditorState<SerializedLexicalNode>,
        },
      },
    } as CardMindNode;
    console.log('节点', newNode);

    this.appendNode(point, newNode);
    this.deleteNode(
      allList.filter(
        (item) =>
          item.type !== 'card' ||
          (item.type === 'card' && item.data.status?.open === 'content'),
      ),
    );
  }
  /** 卡片分隔 */
  async cardToTextGroup() {
    const node = this.selectedNodeList$()[0];
    const editorState = (node.data as CardDataType).value?.editorState;
    if (!editorState) {
      return;
    }
    const treeList = cardDomConvertList(editorState);
    const textNodeList: MindNode[] = [];
    const textNodeMap = new Map();
    const edgeList: Edge[] = [];
    while (treeList.length) {
      const item = treeList.shift()!;
      const initData = await item.toData(this);
      if (!initData) {
        continue;
      }
      const newNode = {
        id: v4(),
        position: {
          x: node.position.x + node.measured!.width! + 50,
          y: node.position.y,
        },
        ...initData,
      };

      textNodeList.push(newNode);
      textNodeMap.set(item, newNode);
      if (item.children.length) {
        treeList.push(...item.children);
      }
      if (item.parent) {
        const parentNode = textNodeMap.get(item.parent)!;

        edgeList.push(
          this.getEdgeConfig(node.data.edge, {
            id: v4(),
            source: parentNode.id,
            sourceHandle: 'right-source',
            target: newNode.id,
            targetHandle: 'left-target',
          }),
        );
      } else {
        edgeList.push(
          this.getEdgeConfig(node.data.edge, {
            id: v4(),
            source: node.id,
            sourceHandle: 'right-source',
            target: newNode.id,
            targetHandle: 'left-target',
          }),
        );
      }
    }
    this.setNodes()!((list) => {
      return list.concat(textNodeList);
    });
    this.setEdges()!((list) => {
      return list.concat(edgeList);
    });
  }

  #parseDefaultNodeConfig(schema: any, templateDefaultValue?: any) {
    // 目前没有配置阴影,所以说没有列表问题?
    const defaultValue = getDefaults(schema);
    return defaultsDeep({}, templateDefaultValue, defaultValue);
  }
  async getDefaultConfig(type: string, options?: any) {
    let defaultData;
    const templateObj = this.globalConfig().options.nodeTemplatePreset;
    if (
      templateObj?.enable &&
      templateObj.value &&
      (templateObj.value as any)[type]
    ) {
      defaultData = await this.client.mind.nodeTemplate.getOne.query(
        (templateObj.value as any)[type],
      );
      defaultData = omitDeepBy(defaultData, (a) => a === null);
    }
    switch (type) {
      case 'card':
        if (options?.open === 'content') {
          const parsedData = this.#parseDefaultNodeConfig(
            ContentCardDefaultDefine,
            defaultData,
          );

          return {
            data: parsedData,
          };
        }

        return {
          width: 350,
          height: 300,
          data: this.#parseDefaultNodeConfig(
            FullCardDefaultDefine,
            defaultData,
          ),
        };

      case 'chat':
        return {
          width: 350,
          height: 400,
          data: this.#parseDefaultNodeConfig(ChatDefaultDefine, defaultData),
        };
      case 'image':
        return {
          data: this.#parseDefaultNodeConfig(ImageDefaultDefine, defaultData),
        };
      case 'draw':
        return {
          data: this.#parseDefaultNodeConfig(DrawDefaultDefine, defaultData),
        };
      default:
        throw '';
    }
  }
}
interface MidNode {
  type: 'line' | 'content';
  data: SerializedLexicalNode[];
  contentList: MidNode[];
  childList: MidNode[];
}
/** 文本转卡片 */
class TMP_NODE_ITEM {
  children: TMP_NODE_ITEM[] = [];

  constructor(
    public id: string,
    public node: MindNode,
  ) {}
  toNode(data = this.#toData(), level = 1): SerializedLexicalNode[][] {
    if (!data) {
      return [];
    }
    const list: SerializedLexicalNode[][] = [];
    switch (data.type) {
      case 'line': {
        if (level < 4) {
          const hnode = {
            tag: `h${level}`,
            indent: 0,
            format: '',
            children: data.data,
            type: 'heading',
          } as SerializedHeadingNode;
          list.push([hnode]);
          data.contentList.forEach((item) => {
            this.toNode(item, level + 1).forEach((item) => {
              list.push(item);
            });
          });
          if (data.childList.length) {
            if (level === 3) {
              const ulNode = createLexicalUlSerialNode();
              list.push([ulNode]);
              data.childList.forEach((item) => {
                this.toNode(item, level + 1).forEach((item) => {
                  ulNode.children.push(createLexicalLiSerialNode(item));
                });
              });
            } else {
              data.childList.forEach((item) => {
                this.toNode(item, level + 1).forEach((item) => {
                  list.push(item);
                });
              });
            }
          }
        } else {
          list.push(data.data);
          if (data.childList.length) {
            const ulNode = createLexicalUlSerialNode();
            list.push([ulNode]);
            data.childList.forEach((item) => {
              this.toNode(item, level + 1).forEach((item) => {
                ulNode.children.push(createLexicalLiSerialNode(item));
              });
            });
          }
        }
        break;
      }
      case 'content': {
        if (level < 4) {
          list.push(data.data);
          data.contentList.forEach((item) => {
            this.toNode(item).forEach((item) => {
              list.push(item);
            });
          });
          data.childList.forEach((item) => {
            this.toNode(item).forEach((item) => {
              list.push(item);
            });
          });
        } else {
        }
        break;
      }

      default:
        break;
    }

    return list;
  }
  #toData(level = 1): MidNode | undefined {
    const contentList: MidNode[] = [];
    const childList: MidNode[] = [];
    this.children.forEach((item) => {
      const result = item.#toData(level + 1);
      if (result) {
        if (result.type === 'content') {
          contentList.push(result);
        } else {
          childList.push(result);
        }
      }
    });
    let node: Omit<MidNode, 'contentList' | 'childList' | 'level'>;
    switch (this.node.type) {
      case 'card': {
        const value = this.node.data.value;
        const editorState =
          value?.editorState as SerializedEditorState<SerializedLexicalNode>;
        if (!editorState) {
          return;
        }
        if (this.node.data.status?.open === 'content') {
          const data = editorState.root.children;
          if (
            editorState.root.children.length > 1 ||
            editorState.root.children[0].type !== 'paragraph'
          ) {
            node = {
              type: 'content',
              data,
            };
          } else {
            node = {
              type: 'line',
              data: (data[0] as any).children,
            };
          }
        } else {
          const sNode: SerializedCustomLinkNode = {
            children: [createLexicalText(this.node.data.title || '未命名')],
            type: 'custom-link',
            options: {
              nodeId: this.node.id,
              type: 'node',
            },
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          };

          node = {
            type: 'line',
            data: [sNode],
          };
        }
        break;
      }
      case 'image': {
        // 正常情况下是?
        const data = this.node.data;
        if (!data.value?.src) {
          return;
        }
        node = {
          type: 'line',
          data: [
            {
              type: 'image',
              version: 1,
              options: {
                src: data.value.src,
                width: this.node.measured!.width,
                height: this.node.measured!.height,
              },
            } as SerializedImageNode,
          ],
        };
        break;
      }
      default:
        return;
    }

    return { ...node, contentList, childList } as MidNode;
  }
}
