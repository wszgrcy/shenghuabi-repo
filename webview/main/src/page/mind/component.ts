import {
  Component,
  EnvironmentInjector,
  OnInit,
  ViewContainerRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactOutlet } from '@cyia/ngx-bridge/react-outlet';

import {
  ReactFlow,
  Panel,
  BackgroundVariant,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  useOnSelectionChange,
  MiniMap,
  Edge,
  Connection,
  reconnectEdge,
  ReactFlowProps,
  getOutgoers,
  getConnectedEdges,
  ReactFlowInstance,
} from '@xyflow/react';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { createElement, useCallback, useEffect, useMemo, useRef } from 'react';
import { getNearestHandleId, wrapControlNode } from './custom-node/wrap-node';
import { ContainerComponent } from './custom-node/container/container.component';
import { ImageNodeComponent } from './custom-node/image/image.component';
import { v4 } from 'uuid';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  debounceTime,
  filter,
  finalize,
  map,
  merge,
  pairwise,
  skip,
} from 'rxjs';
import { BridgeService } from './service';
import { TrpcService } from '../../service/trpc.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MIND_DEFINE } from './config/config-editor';
import { deepClone } from '../../util/clone';
import { AiChatNode } from './custom-node/ai-chat-node/component';
import { DocumentEvent } from '../../../../../src/share/mind.const';
import { StoreComponent } from './store/component';
import { toObservable } from '@angular/core/rxjs-interop';
import { effectOnce } from '../../util/effect-once';
import { wrapEdge } from './custom-node/wrap-edge';
import { DefaultEdgeComponent } from './custom-edge/default/component';
import { CustomNode } from './custom-node/type';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { wrapControlNodeDynamic } from './custom-node/wrap-node2';
import {
  FlowBseService,
  FlowDefaultConfig,
} from '../../component/flow-base/flow-base.service';
import { deepFilterBoolean } from '@fe/util/deep-filter-boolean';
import { deepEqual } from 'fast-equals';
import { diff } from 'just-diff';
import { get, set, unset } from 'lodash-es';
import { GlobalConfigType, MindNode, NodeEdgeConfigType } from '@bridge/share';
import { DrawLayer } from './layer/draw/component';
import { DrawNodeComponent } from './custom-node/draw-node/component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SafeHtmlPipe } from '../../pipe/san-html.pipe';
import { NodeIconObject } from './define';
import { filterNodeByString } from './util/fileter-node';
import { MIND_OPTIONS_CONTEXT } from './config/react.define';
import { configFormat } from './util/config-format';
import { nodeDataFilter } from './util/node-data-filter';
import { FlowBaseDirective } from '@fe/component/flow-base/flow-base.component';
import { ClipboardKind } from '@fe/util/clipboard';
import { CardEditorComponent } from './custom-node/card-editor/card-editor.component';
import { PiyingView } from '@piying/view-angular';
import { getDefaults } from '@piying/view-angular-core';

import { WebviewMindConfigDefine } from './config/define';
import { FieldGlobalConfig } from './field-default-cofig';
import { MergeClassPipe } from '@piying-lib/angular-daisyui/pipe';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    ReactOutlet,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    MatSidenavModule,
    ReactiveFormsModule,
    StoreComponent,
    PurePipe,
    DrawLayer,
    MatDialogModule,
    MatAutocompleteModule,
    SafeHtmlPipe,
    PiyingView,
    MergeClassPipe,
  ],
  providers: [
    BridgeService,
    { provide: FlowBseService, useExisting: BridgeService },
  ],
  styleUrl: './component.scss',
})
export default class MindEditor extends FlowBaseDirective implements OnInit {
  drawer = viewChild.required<MatDrawer>('drawer');

  readonly ReactFlow = (props: any) => {
    return createElement(
      MIND_OPTIONS_CONTEXT.Provider,
      {
        value: props.options,
      },
      createElement(ReactFlow, props.props, props.children),
    );
  };
  readonly Background = Background;
  readonly BackgroundVariant = BackgroundVariant;
  readonly Controls = Controls;
  readonly Panel = Panel;
  readonly MiniMap = MiniMap;
  /** react 组件结束 */
  readonly NodeIconObject = NodeIconObject;

  envInjector = inject(EnvironmentInjector);
  containerRef = inject(ViewContainerRef);
  service = inject(BridgeService);
  #dialog = inject(MatDialog);

  /** 节点变化 */
  #dataChange = new Subject();
  searchContent$ = signal('');
  /**
   *  todo 可以专门搞一个节点转换文本的方法.因为对话也要使用
   */
  searchResult$ = computed(() => {
    const value = this.searchContent$();
    if (!value) {
      return [];
    }
    const list = this.service.nodes$();
    return filterNodeByString(list, value);
  });

  context = (props: any) => {
    /**
     * todo 准备去掉,改外部传入
     */
    const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
    const instance = useReactFlow<CustomNode>();
    const connectingNodeId = useRef(null);
    // onConnectStart onConnect onConnectEnd
    // 链接完成加边,只有两个两连才触发,否则不会
    const onConnect = useCallback(
      (params: Connection) => {
        connectingNodeId.current = null;
        const node = this.service.getNode(params.source)!;
        setEdges((eds) =>
          addEdge(this.service.getEdgeConfig(node?.data.edge, params), eds),
        );
      },
      [setEdges],
    );
    // 链接开始
    const onConnectStart = useCallback((_: any, event: any) => {
      connectingNodeId.current = event;
    }, []);
    // 链接结束 加新的节点
    const onConnectEnd = useCallback(
      async (event: any) => {
        if (!this.service.globalConfig().options.dropGenerate) {
          return;
        }
        if (!connectingNodeId.current) {
          return;
        }
        // todo 增加一个选项用来改配置
        // 判断是否是地板空白
        const targetIsPane =
          event.target.classList.contains('react-flow__pane');
        if (!targetIsPane) {
          return;
        }
        const { nodeId, handleType, handleId } =
          connectingNodeId.current as any;
        const current = instance.getNode(nodeId)!;
        if (current.type === 'chat') {
          return;
        }
        const id = v4();

        // 创建节点
        instance.addNodes({
          id,
          position: instance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          }),
          type: current.type,
          ...(await this.service.getDefaultConfig(current.type!)),
        } as MindNode);
        // 新边
        const edgeNodeList: [string, string] = [nodeId, id];
        instance.addEdges(
          this.service.getEdgeConfig(current.data.edge, {
            id,
            source: edgeNodeList[0],
            target: edgeNodeList[1],
            sourceHandle: handleId,
            targetHandle: getNearestHandleId(handleId),
          }),
        );
      },
      [
        instance.addEdges,
        instance.screenToFlowPosition,
        instance.addNodes,
        instance.getNode,
      ],
    );

    useEffect(() => {
      this.#dataChange.next(undefined);
    }, [nodes, edges]);

    useOnSelectionChange({
      onChange: useCallback(({ nodes }) => {
        this.service.selectedNodeList$.set(nodes as any);
      }, []),
    });

    useEffect(() => {
      this.service.instance.set(instance);
    }, [instance]);
    const onNodeClick = useCallback(
      (event: React.MouseEvent, node: CustomNode) => {
        this.service.selectedNodeList$.set([node]);
      },
      [],
    );

    useEffect(() => {
      if (props.dataInited) {
        this.service.nodes.set(nodes);
      }
    }, [nodes, props.dataInited]);
    useEffect(() => {
      this.service.edges.set(edges);
    }, [edges]);
    useEffect(() => {
      this.service.setNodes.set(setNodes);
    }, [setNodes]);
    useEffect(() => {
      this.service.setEdges.set(setEdges);
    }, [setEdges]);

    // todo 会影响原有拖动。再说
    // const edgeUpdateSuccessful = useRef(true);
    // const onEdgeUpdateStart = useCallback(() => {
    //   edgeUpdateSuccessful.current = false;
    // }, []);

    // const onEdgeUpdate = useCallback((oldEdge: any, newConnection: any) => {
    //   edgeUpdateSuccessful.current = true;
    //   setEdges((els) => updateEdge(oldEdge, newConnection, els));
    // }, []);

    // const onEdgeUpdateEnd = useCallback((_: any, edge: any) => {
    //   if (!edgeUpdateSuccessful.current) {
    //     setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    //   }
    //   edgeUpdateSuccessful.current = true;
    // }, []);
    const onReconnect = useCallback(
      (oldEdge: Edge, newConnection: Connection) =>
        setEdges((els) => reconnectEdge(oldEdge, newConnection, els)),
      [],
    );

    const compProps = {
      ...FlowDefaultConfig,
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onConnectStart,
      onConnectEnd,
      onReconnect,
      onNodeClick,
      // 修复右键后选中,然后不会再变成空的问题
      onPaneClick: useCallback(() => {
        this.service.selectedNodeList$.set([]);
      }, []),

      selectionMode: props.config?.selectionMode,
      snapToGrid: true,
      snapGrid: [5, 5],
      // onEdgeUpdate,
      // onEdgeUpdateStart,
      // onEdgeUpdateEnd,
      proOptions: { hideAttribution: true },
      edgeTypes: useMemo(
        () => ({ default: wrapEdge(DefaultEdgeComponent) }),
        [],
      ),
      nodeTypes: useMemo(
        () => ({
          chat: wrapControlNodeDynamic(AiChatNode, this.service),
          card: wrapControlNode(CardEditorComponent, this.service),
          container: wrapControlNode(ContainerComponent, this.service),
          image: wrapControlNode(ImageNodeComponent, this.service),
          draw: wrapControlNode(DrawNodeComponent, this.service),
        }),
        [],
      ) as any,
      onSelectionContextMenu: useCallback((event: React.MouseEvent) => {
        this.contextChange(event, 'selection');
      }, []),
      onNodeContextMenu: useCallback(
        (event: React.MouseEvent, node: CustomNode) => {
          this.contextChange(event, 'node');
          this.service.selectedNodeList$.set([node]);
        },
        [],
      ),
      onPaneContextMenu: useCallback((event: React.MouseEvent) => {
        this.contextChange(event, 'pane');
      }, []),
      onNodesDelete: useCallback((list: CustomNode[]) => {
        const edges = this.service.edges()!;
        const nodes = this.service.nodes$();
        const IDList = list
          .flatMap((item) => {
            if (!item.data.fold) {
              return [];
            }
            const foldObj = item.data.fold;
            const foldList = [];
            for (const key in foldObj) {
              const value = (foldObj as any)[key];
              if (!value) {
                continue;
              }
              const cEdges = getConnectedEdges([item], edges).filter(
                (maybeChild) =>
                  maybeChild.source === item.id &&
                  maybeChild.sourceHandle === `${key}-source`,
              );
              const nodeList = getOutgoers(item, nodes, cEdges);
              foldList.push(...nodeList);
            }
            return foldList;
          })
          .map((item) => this.service.nodesObj$()[item.id])
          .map((node) => {
            return [...this.service.getAllDescent(node, 9999), node];
          })
          .flat(9999)
          .map((item) => item.id);
        this.service.deleteNode(
          [...new Set(IDList)].map((item) => {
            return { id: item };
          }),
        );
      }, []),
    } as ReactFlowProps<CustomNode, Edge>;
    return {
      props: { props: compProps, options: props.globalStyle },
    };
  };
  #client = inject(TrpcService).client;
  #trpc = inject(TrpcService);
  storeList = signal<Partial<CustomNode>[]>([]);
  configModel = signal<
    (Omit<CustomNode, 'id'> & { idList: string[] }) | GlobalConfigType
  >({} as any);
  dataInited$ = signal(false);
  override nodeClipBoardKind: ClipboardKind = 'mind-node';
  constructor() {
    super();
    this.#trpc.client.mind.dataChange.subscribe(undefined, {
      onData: (value) => {
        this.requestData.next(
          !Object.keys(value).length
            ? getDefaults(WebviewMindConfigDefine)
            : value,
        );
      },
    });

    toObservable(this.configModel)
      .pipe(
        filter(Boolean),
        map((item) => deepClone(item)),
        pairwise(),
        filter(([pre, current]) => {
          if ('idList' in pre && 'idList' in current) {
            return deepEqual(pre.idList, current.idList);
          }
          return false;
        }),
        filter(
          (data) => this.drawer().opened && this.drawerType() === 'config',
        ),
      )
      .subscribe(([pre, current]) => {
        const idList = (
          current as Omit<CustomNode, 'id'> & { idList: string[] }
        ).idList;
        let hasChangeEdge = false;
        const changeList = diff(pre, current).map((item) => {
          if (
            !hasChangeEdge &&
            deepEqual(item.path.slice(0, 2), ['data', 'edge'])
          ) {
            hasChangeEdge = true;
          }
          if (item.op === 'replace' || item.op === 'add') {
            return (node: CustomNode) => {
              set(node, item.path, item.value);
            };
          } else if (item.op === 'remove') {
            return (node: CustomNode) => {
              unset(node, item.path);
              return item.path;
            };
          }
          return () => {};
        });
        if (!changeList.length) {
          return;
        }
        const changeEdgeNodeObj: Record<string, NodeEdgeConfigType> = {};
        this.service.setNodes()!((list) => {
          return list.map((item) => {
            if (idList.includes(item.id)) {
              item = deepClone(item);
              const removePathList = changeList
                .map((fn) => fn(item))
                .filter(Boolean) as unknown as (string | number)[][];
              for (const pathList of removePathList) {
                const lastPath = pathList.pop();
                if (typeof lastPath === 'number') {
                  const list = get(item, pathList) as any[];
                  const newList: any[] = [];
                  list.forEach((item) => {
                    newList.push(item);
                  });
                  set(item, pathList, newList);
                }
              }

              if (hasChangeEdge && item.data.edge) {
                // todo 动画提示问题?因为它没有{enable,value}
                changeEdgeNodeObj[item.id] = item.data.edge;
              }
              item.data = nodeDataFilter(item) as any;
              return item;
            }

            return item;
          });
        });
        if (hasChangeEdge) {
          this.service.setEdges()!((list) => {
            return list.map((edge) => {
              const edgeConfig = deepFilterBoolean(
                changeEdgeNodeObj[edge.source],
              );
              if (edgeConfig) {
                return this.service.getEdgeConfig(edgeConfig, edge);
              }
              return edge;
            });
          });
        }
      });

    this.service.listen();
    // 全局变化时
    effect(() => {
      const isGlobal = this.service.isGlobal$$();
      if (!isGlobal) {
        return;
      }
      this.fieldContext.isGlobal$$.next(true);
      this.fieldContext.enableEditorConfig$$.next(false);
      untracked(() => {
        const globalConfig = this.service.globalConfig();
        this.configModel.set(deepClone(globalConfig));
      });
    });
    // 文件选择变化时
    effect(() => {
      const isGlobal = this.service.isGlobal$$();
      if (isGlobal) {
        return;
      }
      this.service.selectNodeChanged$$();
      const list = untracked(() => this.service.configSelectedNodeList());
      this.fieldContext.isGlobal$$.next(false);
      this.fieldContext.enableEditorConfig$$.next(
        list.every((item) => item.type === 'chat' || item.type === 'card'),
      );

      const config = configFormat(list);
      untracked(() => {
        this.configModel.set(
          deepClone({
            idList: list.map((item) => item.id),
            data: config,
          }) as any,
        );
      });
    });
  }
  protected override async resolvedData(
    instance: NonNullable<ReturnType<FlowBseService<any>['instance']>>,
    data: any,
  ): Promise<void> {
    const parsedData = data;
    // console.log('解析数据', parsedData);
    untracked(() => {
      this.storeList.set(parsedData.storeList as any);
    });
    // 解析
    const { x, y, zoom } = parsedData.flow.viewport;
    this.service.globalConfig.update((data) => {
      return { ...data, ...parsedData.globalConfig };
    });
    instance.setNodes(parsedData.flow.nodes as any);
    instance.setEdges(parsedData.flow.edges);
    instance.setViewport({ x, y, zoom });
    setTimeout(() => {
      this.dataInited$.set(true);
      this.#trpc.client.mind.inited.query(undefined);
    }, 100);
    this.service.id$.set(parsedData.id);
    if (parsedData.draw?.edit) {
      this.service.drawNodeChange$.next({
        type: 'change',
        source: 'restore',
        value: parsedData.draw.edit,
      });
    }
  }
  override ngOnInit(): void {
    super.ngOnInit();
    this.#trpc.client.mind.listenEvent.subscribe(undefined, {
      onData: async (request) => {
        const response = { id: request.id, data: undefined as any };
        switch (request.method) {
          case DocumentEvent.focusNode:
            {
              response.data = await effectOnce(
                () => {
                  return this.service.nodes() && this.service.instance();
                },
                (instance) => {
                  const node = instance.getNode(request.args![0].nodeId);
                  if (node) {
                    this.service.moveTo(node);
                  }
                },
                this.injector,
              );
            }
            break;
          case DocumentEvent.getContent: {
            response.data = await effectOnce(
              () => {
                return this.service.nodes() && this.service.instance();
              },
              (instance) => {
                if (this.error$()) {
                  return;
                }

                return this.#getSaveData(
                  instance,
                  this.service.drawNodeEditStatus$()?.value,
                );
              },
              this.injector,
            );
            break;
          }
          default:
            break;
        }
        if (!response.data) {
          return;
        }
        this.#trpc.client.mind.sendEvent.query(response, {
          context: { compress: true },
        });
      },
    });
  }
  //! 监听变更更新
  override listenUpdate() {
    // todo 是否减少频率。比如拖动时。鼠标按下？
    return combineLatest([
      merge(
        toObservable(this.storeList, { injector: this.injector }).pipe(skip(1)),
        this.#dataChange,
      ),
      toObservable(this.service.instance, { injector: this.injector }).pipe(
        filter(Boolean),
      ),
      this.service.drawNodeEditStatus$$,
    ])
      .pipe(
        map(([_, instance, drawEdit]) => {
          return [instance, drawEdit] as const;
        }),
        debounceTime(500),
      )
      .subscribe(([instance, drawEdit]) => {
        if (this.error$()) {
          return;
        }
        // 编码
        this.#trpc.client.mind.sendEvent.query(
          {
            id: 0,
            method: 'update',
            data: this.#getSaveData(instance, drawEdit.value),
          },
          { context: { compress: true } },
        );
      });
  }
  #getSaveData(instance: ReactFlowInstance<CustomNode, any>, data: any) {
    const result = instance.toObject();
    return {
      flow: result,
      storeList: this.storeList(),
      globalConfig: this.service.globalConfig(),
      draw: {
        edit: data,
      },
      id: this.service.id$(),
      // 当前版本
      version: 3,
    };
  }

  async exportImage() {
    const el: HTMLElement = (
      this.reactflowElement().nativeElement as HTMLElement
    ).querySelector('.react-flow__pane') as HTMLElement;
    const result = (await (await import('html-to-image')).toBlob(el))!;
    this.#client.document.saveFile.query({
      filePath: window.__pageConfig.data.filePath!,
      data: await result.arrayBuffer(),
      extension: '.png',
    });
  }

  configForm = new FormGroup({});
  EMPTY_ITEM = { label: '---空---', value: '' };
  templateListOb = () => {
    let listSup: any;
    const observable = new Observable<{ label: string; value: string }[]>(
      (ob) => {
        listSup = this.#trpc.client.mind.nodeTemplate.getAll$.subscribe(
          undefined,
          {
            onData: (obj) => {
              ob.next([
                this.EMPTY_ITEM,
                ...Object.keys(obj).map((value) => {
                  return { label: value, value: value };
                }),
              ]);
            },
            onComplete: () => {
              ob.complete();
            },
          },
        );
      },
    ).pipe(
      finalize(() => {
        listSup.unsubscribe();
      }),
    );
    return observable;
  };
  fieldContext = {
    getAllTheme: () => {
      return this.#trpc.client.mind.nodeTheme.getAll
        .query(undefined)
        .then((list) => {
          return [
            { label: '---空---', value: '' },
            ...list.map((item) => {
              return { label: item, value: item };
            }),
          ];
        });
    },
    openThemeDir: () => {
      this.#trpc.client.mind.openThemeDir.query(undefined);
    },
    isGlobal$$: new BehaviorSubject(false),
    enableEditorConfig$$: new BehaviorSubject(false),
    templateList$$: this.templateListOb(),
    layoutNode: (level: number) => {
      this.service.layoutNode(
        this.service.selectedNodeList$(),
        this.configModel()?.data?.layout as any,
        {
          level: level,
        },
      );
    },
  };
  schema = MIND_DEFINE;
  options = {
    context: this.fieldContext,
    fieldGlobalConfig: FieldGlobalConfig,
  };

  drawerType = signal('config');
  toggleSidebar(currentDrawer: MatDrawer, type: 'config' | 'store') {
    if (this.drawerType() === type) {
      currentDrawer.toggle();
    } else {
      this.drawerType.set(type);
      if (!currentDrawer.opened) {
        currentDrawer.toggle();
      }
    }
  }

  moveToStoreList() {
    const data = this.service.selectedNodeList$()[0];
    this.storeList.update((list) => {
      list.push(data);
      return list;
    });
    this.service.deleteSelected();
  }
  layoutNode(level: number) {
    const node = this.service.selectedNodeList$()[0];
    this.service.layoutNode(
      this.service.selectedNodeList$(),
      this.service.getLayoutConfig(node.data.layout),
      {
        level,
      },
    );
  }
  storeComp = viewChild<StoreComponent>('storeComp');
  drawLayer = viewChild.required<DrawLayer>('drawLayerComp');
  dropChanged(e: DragEvent) {
    const type = e.dataTransfer!.getData('type');
    if (type !== 'store') {
      return;
    }
    const index = this.storeComp()!.activateIndex();
    const item = this.storeList()[index];
    delete item.position;
    this.service.appendNode({ x: e.clientX, y: e.clientY }, item);
    this.storeList.update((list) => {
      list.splice(index, 1);
      return list.slice();
    });
  }
  dragoverChange(e: DragEvent) {
    e.preventDefault();
  }
  openDrawLayer() {
    this.service.drawNodeChange$.next({
      type: 'change',
      source: 'add',
      value: undefined,
    });
  }
  async toggleHelp() {
    this.#dialog.open(
      (await import('./dialog/help/component')).MindHelpComponent,
    );
  }
  searchChange(node: CustomNode) {
    this.service.moveTo(node);
  }
  nodeFormConfigChanged(data: any) {
    if (!('idList' in data)) {
      this.service.globalConfig.set(deepClone(data));
      this.service.setEdges()?.((edges) => {
        return edges.map((item) => {
          const node = this.service.getNode(item.source)!;
          if (!item.source) {
            return item;
          }
          return this.service.getEdgeConfig(node.data.edge, item);
        });
      });
    } else {
      // 因为默认是改引用无法触发observable
      this.configModel.set(deepClone(data));
    }
  }
}
