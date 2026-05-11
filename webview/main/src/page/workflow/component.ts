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
  Node,
  useOnSelectionChange,
  ControlButton,
  MarkerType,
  MiniMap,
  reconnectEdge,
  Edge,
  Connection,
  ReactFlowInstance,
} from '@xyflow/react';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BaseSyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { Subject, combineLatest, debounceTime, filter, map, skip } from 'rxjs';
import { BridgeService } from './service';
import { TrpcService } from '../../service/trpc.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { deepClone } from '../../util/clone';
import { DocumentEvent } from '../../../../../src/share/mind.const';
import { toObservable } from '@angular/core/rxjs-interop';

import { effectOnce } from '../../util/effect-once';
import { wrapEdge } from './custom-node/wrap-edge';
import { DefaultEdgeComponent } from './custom-edge/default/component';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { NodePanelComponent } from './panel/node/component';
import { deepEqual } from 'fast-equals';
import { IterationNodeDefine } from './custom-node/iteration-node';
import { ChatService } from '@fe/component/chat/chat.service';
import { ValidatePanelComponent } from './panel/validate/component';
import { CustomNode } from './type';
import {
  FlowBseService,
  FlowDefaultConfig,
} from '../../component/flow-base/flow-base.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { WORKFLOW_VERSION } from '@bridge/share';
import { FlowBaseDirective } from '@fe/component/flow-base/flow-base.component';
import { ClipboardKind } from '@fe/util/clipboard';
import { defaultConfigMerge } from '@fe/util/default-config-merge';
import { ChatNodeService } from '../../domain/chat-node/chat-node.service';
import { isNumber } from 'lodash-es';

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
    MatIconModule,
    PurePipe,
    NodePanelComponent,
    ValidatePanelComponent,
    MatDialogModule,
  ],
  providers: [
    BridgeService,
    ChatService,
    { provide: FlowBseService, useExisting: BridgeService },
    ChatNodeService,
  ],
  styleUrl: './component.scss',
})
export default class WorkflowEditor
  extends FlowBaseDirective
  implements OnInit
{
  drawer = viewChild.required<MatDrawer>('drawer');

  ReactFlow = ReactFlow;
  Background = Background;
  BackgroundVariant = BackgroundVariant;
  Controls = Controls;
  ControlButton = ControlButton;
  Panel = Panel;
  MiniMap = MiniMap;

  envInjector = inject(EnvironmentInjector);
  containerRef = inject(ViewContainerRef);

  /** 节点变化 */
  #dataChange = new Subject<undefined>();
  service = inject(BridgeService);
  disableAction = signal(true);
  iterationType = IterationNodeDefine.type;
  context = (props: any) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
    const instance = useReactFlow();
    const connectingNodeId = useRef(null);
    // onConnectStart onConnect onConnectEnd
    // 链接完成加边,只有两个两连才触发,否则不会
    const onConnect = useCallback(
      (params: Connection) => {
        connectingNodeId.current = null;
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                strokeWidth: 2,
              },
              interactionWidth: 4,
            },
            eds,
          ),
        );
      },
      [setEdges],
    );
    // 链接开始

    useEffect(() => {
      if (props.dataInited) {
        this.#dataChange.next(undefined);
      }
    }, [nodes, edges, props.dataInited]);

    useOnSelectionChange({
      onChange: useCallback(({ nodes }) => {
        this.service.selectedNodeList$.set(nodes);
      }, []),
    });

    useEffect(() => {
      this.service.instance.set(instance);
    }, [instance]);
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
    return {
      props: {
        ...FlowDefaultConfig,
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        onReconnect,
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
        // todo 不知道延迟加载会不会正常
        nodeTypes: useMemo(() => props.nodeTypes, [props.nodeTypes]),
        onSelectionContextMenu: useCallback((event: React.MouseEvent) => {
          this.contextChange(event, 'selection');
        }, []),
        onNodeContextMenu: useCallback(
          (event: React.MouseEvent, node: Node) => {
            this.contextChange(event, 'node');
            this.service.selectedNodeList$.set([node]);
          },
          [],
        ),
        onPaneContextMenu: useCallback((event: React.MouseEvent) => {
          this.contextChange(event, 'pane');
        }, []),
        onNodeClick: useCallback(
          (event: BaseSyntheticEvent<PointerEvent>, node: Node) => {
            this.service.clickedNode.set(node);
          },
          [],
        ),
        onNodeDrag: useCallback(
          (event: React.MouseEvent, node: Node, nodes: Node[]) => {
            this.service.drag(node, 'drag');
          },
          [],
        ),
        onNodeDragStop: useCallback(
          (event: React.MouseEvent, node: Node, nodes: Node[]) => {
            this.service.drag(node, 'dragStop');
          },
          [],
        ),
      },
    };
  };
  #client = inject(TrpcService).client;
  #trpc = inject(TrpcService);
  nodeConfigPanelStatus = signal(false);
  validatePanelStatus = signal(false);
  configProps = computed(
    () => {
      let data = this.service.clickedNode();
      if (!data) {
        return;
      }
      data = this.service.nodes$().find((item) => item.id === data!.id);
      if (!data || !this.service.fullNodeObject$$()[data.type!]) {
        return;
      }
      if (data.data.options?.disableOpenConfig) {
        return;
      }
      return deepClone({ id: data.id, type: data.type, data: data.data });
    },
    { equal: deepEqual },
  );
  dataInited$ = signal(false);
  override nodeClipBoardKind: ClipboardKind = 'workflow-node';
  #chatNode = inject(ChatNodeService);
  constructor() {
    super();

    // 初始化请求
    this.#trpc.client.workflow.dataChange.subscribe(undefined, {
      onData: (value) => {
        if (isNumber(value?.version) && value.version < 7) {
          this.#trpc.client.common.warn.query(
            '工作流版本过低,请使用迁移版本升级',
          );
          return;
        }
        if (value?.flow?.nodes) {
          const list = new Set<string>();
          (value.flow.nodes as CustomNode[]).forEach((node) => {
            if (node.type) {
              list.add(node.type);
            }
          });
          this.service.nodeTypeList$.set([...list]);
        }
        this.requestData.next(
          value ?? {
            flow: {
              nodes: [],
              edges: [],
            },
          },
        );
      },
    });

    toObservable(this.service.clickedNode)
      .pipe(skip(1))
      .subscribe((value) => {
        this.nodeConfigPanelStatus.set(true);
      });
    // 切换
    effect(() => {
      const status = this.validatePanelStatus();
      const instance = this.service.instance();
      if (status && instance) {
        untracked(() => {
          this.flowData.set(instance.toObject());
        });
      }
    });
    this.#trpc.client.workflow.getPluginNodeList.subscribe(undefined, {
      onData: async (list) => {
        const result = await Promise.all(
          list.map((item) => {
            return import(item.filePath)
              .then((configFn) => {
                // 可以在此注入配置
                return configFn.default({});
              })
              .then((config) => {
                return { ...config, ...item.config };
              });
          }),
        );
        this.#chatNode.pluginNodeList$.set(result);
      },
    });
  }
  protected override async resolvedData(
    instance: NonNullable<ReturnType<FlowBseService<any>['instance']>>,
    data: any,
  ): Promise<void> {
    const parsedData = data;
    // console.log('解析数据', parsedData);
    // 解析
    const { x = 0, y = 0, zoom = 1 } = parsedData.flow?.viewport || {};
    instance.setNodes(parsedData.flow?.nodes || []);
    instance.setEdges(parsedData.flow?.edges || []);
    instance.setViewport({ x, y, zoom });
    setTimeout(() => {
      this.dataInited$.set(true);
      this.#trpc.client.mind.inited.query(undefined);
    }, 100);
  }
  flowData = signal<any>(undefined);

  override ngOnInit(): void {
    super.ngOnInit();
    this.#trpc.client.mind.listenEvent.subscribe(undefined, {
      onData: async (request) => {
        const response = { id: request.id, data: undefined as any };
        switch (request.method) {
          case DocumentEvent.getContent: {
            response.data = await effectOnce(
              () => {
                return this.service.nodes() && this.service.instance();
              },
              async (instance) => {
                if (this.error$()) {
                  return;
                }

                return this.#getSaveData(instance as any);
              },
              this.injector,
            );
            break;
          }
          default:
            break;
        }
        this.#trpc.client.mind.sendEvent.query(response, {
          context: { compress: true },
        });
      },
    });
  }
  override listenUpdate() {
    // todo 是否减少频率。比如拖动时。鼠标按下？
    return combineLatest([
      this.#dataChange,
      toObservable(this.service.instance, { injector: this.injector }).pipe(
        filter(Boolean),
      ),
    ])
      .pipe(
        map(([_, instance]) => {
          return instance;
        }),
        debounceTime(500),
      )
      .subscribe((instance) => {
        if (this.error$()) {
          return;
        }
        const result = instance.toObject();
        this.flowData.set(result);
        // 编码
        this.#trpc.client.mind.sendEvent.query(
          {
            id: 0,
            method: 'update',
            data: this.#getSaveData(instance as any),
          },
          { context: { compress: true } },
        );
      });
  }
  #getSaveData(instance: ReactFlowInstance<CustomNode, Edge>) {
    const result = instance.toObject();
    result.nodes.forEach((item) => {
      delete item.selected;
    });
    result.edges.forEach((item) => {
      delete item.selected;
    });
    this.flowData.set(result);

    return {
      flow: result,
      version: WORKFLOW_VERSION,
      update: Date.now(),
    };
  }

  addNode(type: string) {
    const config = this.service.fullNodeObject$$()[type];
    const node = this.service.appendNode(this.service.contextMenuPoint(), {
      ...defaultConfigMerge(config, config.config ?? config.displayConfig),
      type: type,
    });
    config.afterAdd?.(node as any, this.injector as any);
  }

  toggleAction() {
    this.disableAction.update((a) => !a);
  }
  #dialog = inject(MatDialog);

  // todo 节点变更
  async toggleHelp() {
    this.#dialog.open(
      (await import('./dialog/help/component')).MindHelpComponent,
    );
  }
}
