import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MindChatProviderService } from './mind.provider.service';
import {
  ChatComponent,
  INIT_CONTEXT,
  INIT_TITLE,
} from '@fe/component/chat/component';
import { BridgeService } from '../../service';
import { deepEqual } from 'fast-equals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { getConnectedEdges, getOutgoers } from '@xyflow/react';
import { MatMenuModule } from '@angular/material/menu';
import { ChatMode } from '../../../../../../../src/share/ai.type';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrpcService } from '@fe/trpc';
import { deepClone } from '../../../../util/clone';
import { effectOnce } from '../../../../util/effect-once';
import { MenuGroupComponent } from '@fe/component/menu-group/component';
import { ChatService } from '@fe/component/chat/chat.service';
import { NodeBase } from '../node.base';
import { parseBuildNode } from '../../../../type-define/mind-node';
import { ChatDataType, flatFilterHandleList, UUID_NS } from '@bridge/share';
import { v5 } from 'uuid';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    ChatComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MenuGroupComponent,
    AsyncPipe,
  ],
  providers: [
    { provide: ChatService, useExisting: MindChatProviderService },
    MindChatProviderService,
  ],
  selector: `ai-chat-node`,
  styleUrl: './component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatNode extends NodeBase<ChatDataType> {
  #client = inject(TrpcService).client;
  comp = viewChild<ChatComponent>('aiChat');

  #title = computed(() => this.data$().title);

  #bridge = inject(BridgeService);
  #provider = inject(MindChatProviderService);
  #injector = inject(Injector);
  /**
   * 数据持久化
   * 可以选择模板
   * 保存导出
   */
  root = viewChild<ElementRef<HTMLDivElement>>('root');
  dataChange = output<Partial<ChatDataType>>();
  inStore = input(false);
  //todo 这里只获取第一次,不会更新
  list = computed(() => {
    return this.#client.chat.loadPromptList.query(undefined);
  });
  /** 已经连接到节点的边 */
  #linkedEdges$ = computed(
    () => {
      return getConnectedEdges([this.props()], this.#bridge.edges());
    },
    { equal: deepEqual },
  );
  /** 动态增加 */
  handleInput$ = computed(
    () => {
      return flatFilterHandleList(this.data$()?.handle?.input);
    },
    { equal: deepEqual },
  );
  ngOnInit(): void {
    this.#provider.nodeId = this.props().id;
    // 禁止滚轮滚动
    effectOnce(
      () => this.root(),
      (root) => {
        root.nativeElement.addEventListener('wheel', (e) => {
          e.stopImmediatePropagation();
        });
      },
      this.#injector,
    );
    const inited$ = signal(false);
    // 更新数据用
    effectOnce(
      () => {
        return this.comp();
      },
      (comp) => {
        // 初始化及后续
        effect(
          () => {
            const value = this.value$();
            if (!value) {
              return;
            }
            const title = this.#title();
            if (typeof title !== 'string') {
              return;
            }
            untracked(() => {
              comp.list$.set(value.list || []);
              comp.firstItem$.set(value.firstItem || deepClone(INIT_CONTEXT));
              comp.chatResult$.set(value.chatResult);
              comp.title.set(title || INIT_TITLE);
              inited$.set(true);
            });
          },
          { injector: this.#injector },
        );
        // 变更输出
        effect(
          () => {
            const title = comp.title();
            const list = comp.list$();
            // todo 应该过滤空值
            const firstItem = comp.firstItem$() as any;
            const chatResult = comp.chatResult$();
            untracked(() => {
              if (this.inStore()) {
                this.dataChange.emit({
                  title,
                  value: { list, firstItem, chatResult },
                });
              } else {
                this.#bridge.patchDataOne(this.props().id, {
                  title,
                  value: { list, firstItem, chatResult },
                });
              }
            });
          },
          { injector: this.#injector },
        );
        // 1。根据输入列表定义连接点
        // 2。连接点已连接去掉输入列表的项
        effect(
          () => {
            if (!inited$()) {
              return;
            }
            const inputList = comp.inputNameList();
            if (!inputList) {
              return;
            }

            untracked(() => {
              const oldHandle = deepClone(this.data$()?.handle) || {
                input: [[]],
                output: [],
              };
              oldHandle.input[0] = inputList.map((item) => {
                return { ...item, id: v5(item.value ?? item.label, UUID_NS) };
              });

              this.#bridge.patchDataOne(this.props().id, {
                handle: deepClone(oldHandle),
              });
            });
          },
          { injector: this.#injector },
        );
        effect(
          () => {
            const inputHandle = this.handleInput$();
            const edges = this.#linkedEdges$();
            const disableInputObj = {} as Record<string, true>;
            for (const inputItem of inputHandle) {
              if (edges.some((item) => item.targetHandle === inputItem.id)) {
                disableInputObj[inputItem.label] = true;
              }
            }
            untracked(() => {
              comp.disableInputObject.set(disableInputObj);
            });
          },
          { injector: this.#injector },
        );
      },
      this.#injector,
    );
  }
  canBuildNode = computed(() => {
    return !!this.#chatResult();
  });

  #chatResult = computed(() => {
    if (this.comp()?.firstItem$().mode !== ChatMode.workflow) {
      return;
    }
    const list = this.comp()!.chatResult$();
    if (!list || !list.length) {
      return;
    }
    const lastItem = list[list.length - 1];
    // todo 改为loading之前不处理
    if (lastItem?.value instanceof Object) {
      const result = parseBuildNode(lastItem.value);
      if (!result) {
        return;
      }
      return {
        root: (lastItem as any).extra?.filePath as string | undefined,
        data: result,
      };
    }
    return;
  });

  buildNode() {
    this.bridge.batchBuildNode(
      this.#chatResult()!,
      this.#bridge.getNode(this.id$())!,
    );
  }
  deleteSourceNode() {
    const edges = this.#bridge.edges();
    const nodes = this.#bridge.nodes$();
    const node = this.props();
    const list = getOutgoers(node as any, nodes, edges);

    this.#bridge.deleteNode(list);
  }
  removeSourceEdge() {
    const edges = this.#bridge.edges();
    const node = this.props();
    const deletedEdgeList = getConnectedEdges([node], edges).filter(
      (item) => item.source === node.id && item.target !== node.id,
    );
    // todo可以加个删除边的接口
    this.#bridge.setEdges()!((list) => {
      return list.filter(
        (item) => !deletedEdgeList.some((e) => e.id === item.id),
      );
    });
  }

  saveToPrompt(type: string) {
    const firstItem = this.comp()!.firstItem$()!;
    const data = deepClone(firstItem);
    delete data.input;
    delete data.context;
    this.#client.chat.savePromptTemplateByMind.query({
      type,
      title: this.comp()!.title(),
      ...data,
    });
  }
  callbackGroup = {
    // 从模型中更新
    click: (data: string) => {
      this.#client.chat.getPromptByKey.query(data).then((data) => {
        this.comp()?.title.set(data?.title || '');
        const saved = deepClone(data);
        delete (saved as any).title;
        this.comp()?.firstItem$.set(saved as any);
        this.comp()?.list$.set([]);
      });
    },
  };
}
