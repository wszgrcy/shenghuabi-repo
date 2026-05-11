import {
  Component,
  Injector,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { InputFormComponent } from './input/input-form/component';
import { deepClone } from '../../util/clone';
import {
  AssistantChatMessageType,
  CHAT_ITEM_TYPE,
  ChatInputType,
  ChatMessageListOutputType,
  ChatMode,
  ChatOptions,
  CommonChat,
  isChatStream,
  ResolvedWorkflow,
  WorkflowData,
  WorkflowStreamData,
} from '@bridge/share';
import { ChatService } from './chat.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ChatCommonInput } from './input/common-input/component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrpcService } from '@fe/trpc';

import { CommonChatResultComponent } from './result/common-result/component';
import { WorkflowChatResultComponent } from './result/chat-result/component';
import { PromptTemplateFCC } from './template-form/component';
import { getHumanTemplate } from './const';
import { Unsubscribable } from '@trpc/server/observable';
import { deepEqual } from 'fast-equals';
import { WorkflowInputComponent } from './workflow/input/component';
import { CommonChatFn } from './type';
import { MenuCheckboxFCC } from '@cyia/component/core';

type InputVarList = {
  label: string;
  // id: string;
  value: string;
  inputType: ChatInputType;
}[];
export const INIT_TEMPLATE_LIST: ChatMessageListOutputType = [
  { role: 'system', content: [] },
  { role: 'user', content: [] },
];
export const INIT_TITLE = '';
export const INIT_CONTEXT: ChatOptions = {
  input: {},
  context: {},
  template: INIT_TEMPLATE_LIST,
  mode: ChatMode.template,
};
export const INIT_DEFAULT: ChatOptions = {
  input: {},
  mode: ChatMode.default,
};
export const INIT_WORKFLOW: ChatOptions = {
  input: {},
  mode: ChatMode.workflow,
};
export function getDefaultChatConfig(mode: ChatMode) {
  switch (mode) {
    case ChatMode.default:
      return deepClone(INIT_DEFAULT);
    case ChatMode.template:
      return deepClone(INIT_CONTEXT);
    case ChatMode.workflow:
      return deepClone(INIT_WORKFLOW);
  }
}

@Component({
  selector: 'ai-chat',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressBarModule,
    InputFormComponent,
    MatInputModule,
    MatButtonModule,
    MenuCheckboxFCC,
    ChatCommonInput,
    MatTooltipModule,
    WorkflowChatResultComponent,
    CommonChatResultComponent,
    PromptTemplateFCC,
    WorkflowInputComponent,
  ],
  styleUrl: './component.scss',
})
export class ChatComponent {
  readonly CHAT_TYPE_LIST = [
    {
      value: ChatMode.default,
      icon: 'chat',
      color: 'primary',
      description: '默认对话',
    },
    {
      value: ChatMode.template,
      icon: 'attach_file',
      color: 'primary',
      description: '模板',
    },
    {
      value: ChatMode.workflow,
      icon: 'polyline',
      color: 'primary',
      description: '工作流',
      beforeChange: async () => {
        return await this.#client.workflow.selectWorkflow
          .query(undefined)
          .then((value) => {
            if (value) {
              this.firstItem$.update((item) => {
                return { ...item, workflow: { path: value } };
              });
              return true;
            }
            return false;
          });
      },
    },
  ];
  provider = inject(ChatService);
  /** todo 需要修改  */
  codeAction = signal(false);
  /** 解析输入和上下文。获得要手动输入的变量名 */
  title = signal(INIT_TITLE);
  /** 通用对话历史 */
  readonly list$ = signal<CommonChat[]>([]);
  /** 初始数据 */
  readonly firstItem$ = signal<ChatOptions>(deepClone(INIT_DEFAULT));
  /** context/workflow */
  readonly chatResult$ = signal<WorkflowStreamData[] | undefined>(undefined);
  /** 通用输入 */
  commonInput = signal<CHAT_ITEM_TYPE | undefined>(undefined);
  disableInputObject = signal<Record<string, boolean>>({});
  // todo 暂时不能改,因为workflow是先设置的,而之前清空会导致都没了;可以改成内部切换?不用事件
  modeChange(mode: ChatMode) {
    this.reset(true);
    switch (mode) {
      case ChatMode.workflow: {
        this.firstItem$.update((value: ChatOptions) => {
          value = { ...value };
          value.input = {};
          value.template = undefined;
          return { ...value, mode: mode };
        });
        break;
      }
      case ChatMode.template: {
        this.firstItem$.update((value: ChatOptions) => {
          value = { ...value };
          value.input = {};
          value.workflow = undefined;
          return { ...value, ...deepClone(INIT_CONTEXT), mode: mode };
        });
        break;
      }
      case ChatMode.default: {
        this.firstItem$.update((value: ChatOptions) => {
          value = { ...value };
          value.input = {};
          value.workflow = undefined;
          value.template = undefined;
          value.context = undefined;
          return { ...value, mode: mode };
        });
        break;
      }
      default: {
        throw new Error('');
      }
    }
  }
  #injector = inject(Injector);
  /** 选中的模式 */
  mode$$ = computed(() => {
    return this.firstItem$().mode;
  });
  /** 是否切换为普通对话模式 */
  useChatType$$ = computed(() => {
    const mode = this.mode$$();
    if (mode === ChatMode.default || !!this.#lastChatResult()) {
      return ChatMode.default;
    }
    return mode;
  });
  /** 告知需要手动传入哪些 */
  inputNameList = signal<InputVarList | undefined>(undefined);
  #workflowData = signal<
    (WorkflowData & { define: ResolvedWorkflow }) | undefined
  >(undefined);
  #lastChatResult = computed(() => {
    return this.chatResult$()
      ?.slice()
      .reverse()
      .find((item) => isChatStream(item));
  });
  /** 使用普通对话历史,还是context/workflow返回的历史 */
  readonly #nextChatHistory$ = computed(() => {
    const lastItem = this.list$().at(-1);
    if (lastItem) {
      return lastItem.historyList;
    }
    const item = this.#lastChatResult();
    return item?.extra.historyList || [];
  });
  #workflow$$ = computed(
    () => {
      return this.firstItem$().workflow;
    },
    { equal: deepEqual },
  );
  #ctxTemplate = computed(() => this.firstItem$().template, {
    equal: deepEqual,
  });
  ngOnInit(): void {
    effect(
      () => {
        const mode = this.mode$$();
        if (mode === ChatMode.template) {
          const template = this.#ctxTemplate();
          untracked(() =>
            this.provider.resolveInputs(template).then((value) => {
              if (!value) {
                return;
              }
              this.inputNameList.set(value);
            }),
          );
        } else if (mode === ChatMode.workflow) {
          const workflow = this.#workflow$$();
          if (!workflow) {
            return;
          }
          untracked(() => {
            this.provider
              .getWorkflowWithDefine(workflow)
              .then((workflowData) => {
                this.#workflowData.set(workflowData);
                this.inputNameList.set(workflowData.define.inputList);
              });
          });
        } else if (mode === ChatMode.default) {
          untracked(() => {
            if (this.inputNameList()) {
              this.inputNameList.set([]);
            }
          });
        }
      },
      { injector: this.#injector },
    );
  }
  loading$ = signal(false);

  commonChat: CommonChatFn = (input, historyList, nextIndex) => {
    if (input.length === 1 && input[0].type === 'text' && !input[0].text) {
      return;
    }
    // 移除上一次对话结果
    this.list$.update((list) => {
      return list.slice(0, nextIndex);
    });
    return new Promise<void>((resolve, reject) => {
      this.#chatRef = this.#client.ai.chat.subscribe(
        {
          input: input,
          historyList: historyList,
          modelConfigName: this.firstItem$().modelConfigName,
        },
        {
          onData: (data) => {
            this.list$.update((list) => {
              list[nextIndex] = {
                input: input,
                historyList: data,
                result: data[
                  historyList.length + 1
                ] as AssistantChatMessageType,
              };
              return list.slice();
            });
          },
          onComplete: () => {
            resolve();
          },
          onError: () => {
            resolve();
          },
        },
      );
    });
  };
  protected chatOneResponseFactory(resolve: any) {
    const list: WorkflowStreamData[] = [];
    let index = 0;
    return {
      onData: (input: any) => {
        const value = input as any as WorkflowStreamData;
        const lastItem = list.at(-1);
        // 判断流
        if (lastItem && lastItem.dataId !== input.dataId) {
          index++;
        }
        list[index] = value;
        this.chatResult$.set(list.slice());
      },
      onComplete: resolve,
      onError: (err: any) => {
        console.error(err);
        this.loading$.set(false);
      },
    } as const;
  }
  #chatRef?: Unsubscribable;
  inputData$$ = computed(() => {
    return this.provider.mergeInputParams(this.firstItem$().input!);
  });
  #chatContext() {
    return new Promise<void>(async (resolve) => {
      this.#chatRef = this.#client.ai.agentChat.subscribe(
        {
          input: this.inputData$$(),
          template: this.firstItem$().template!,
          context: this.firstItem$().context!,
          modelConfigName: this.firstItem$().modelConfigName,
        },
        this.chatOneResponseFactory(resolve),
      );
    });
  }
  #chatWorkflow() {
    return new Promise<void>(async (resolve) => {
      this.#chatRef = this.#client.workflow.chat.subscribe(
        {
          input: this.inputData$$(),
          context: this.firstItem$().context!,
          data: this.#workflowData()!,
          modelConfigName: this.firstItem$().modelConfigName,
        },
        this.chatOneResponseFactory(resolve),
      );
    });
  }
  /** 显示模板工作流上次输入内容 */
  lastData: any;
  async chatAll() {
    if (this.loading$()) {
      return;
    }
    this.loading$.set(true);
    try {
      const lastChat = this.useChatType$$();
      switch (lastChat) {
        case ChatMode.default: {
          const historyList = this.#nextChatHistory$() || [];
          const length = this.list$().length;
          const commonInput = this.commonInput();
          if (!commonInput) {
            return;
          }
          await this.commonChat(commonInput, historyList, length);
          this.commonInput.set(undefined);
          break;
        }
        case ChatMode.template: {
          this.lastData = this.inputData$$();
          await this.#chatContext();
          break;
        }
        case ChatMode.workflow: {
          this.lastData = this.inputData$$();
          await this.#chatWorkflow();
          break;
        }
        default:
          break;
      }
    } catch (error) {
    } finally {
      this.loading$.set(false);
      this.firstItem$.update((items) => {
        return {
          ...items,
          context: undefined,
          input: undefined,
        };
      });
    }
  }
  reset(clear: boolean) {
    this.#chatRef?.unsubscribe();
    this.commonInput.set(undefined);
    if (clear) {
      this.chatResult$.set(undefined);
      this.list$.set([]);
    }
    this.loading$.set(false);
    this.firstItem$.update((item) => {
      item.input = {};
      item.context = {};
      return { ...item };
    });
  }

  #client = inject(TrpcService).client;
  menuTooltip = computed(() => {
    const item = this.firstItem$();
    if (item.mode === ChatMode.workflow) {
      return `\n工作流: ${item.workflow?.path || ''}`;
    }
    return '';
  });

  addTemplate() {
    this.firstItem$.update((item) => {
      item = { ...item };
      item!.template = [...item!.template!, getHumanTemplate()];
      return item;
    });
  }
  templateChange(index: number, value: any) {
    this.firstItem$.update((item) => {
      item = { ...item };
      item!.template = deepClone(item!.template);
      item!.template![index] = value;
      return item;
    });
  }
  templateRemove(index: number) {
    this.firstItem$.update((item) => {
      item!.template = deepClone(item!.template);
      item!.template!.splice(index, 1);
      item!.template = item!.template!.slice();
      return { ...item };
    });
  }
  changeModelConfigName() {
    this.#client.chat.getChatModelConfigName
      .query(undefined)
      .then((configName) => {
        if (!configName) {
          return;
        }
        this.firstItem$.update((item) => {
          item.modelConfigName = configName;
          return { ...item };
        });
      });
  }
}
