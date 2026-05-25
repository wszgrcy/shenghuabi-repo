import {
  Component,
  Injector,
  SimpleChanges,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputFormComponent } from './input/input-form/component';
import { deepClone } from '../../util/clone';
import {
  AssistantChatMessageType,
  CHAT_ITEM_TYPE,
  ChatMessageListInputType,
  ChatMessageListOutputType,
  ChatMode,
  ChatOptions,
  CommonChat,
  LLMWorkflowData,
  ResolvedWorkflow,
  WorkflowData,
  WorkflowInvalidConfig,
  WorkflowStreamData,
} from '@bridge/share';
import { ChatService } from './chat.service';
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
import { InvalidForm } from './input/invalid-form';
import {
  WorkflowContextConfig,
  WorkflowRunnerEnvironmentParams,
} from '@shenghuabi/workflow/share';
import { BaseControl } from '@piying/view-angular';
import { PromptListFCC } from '@fe/form/control/prompt-list/component';
import { ChatVariable } from '../../type/chat-variable';
// todo
export function isChatStream(
  data: WorkflowStreamData,
): data is LLMWorkflowData {
  return (
    !!data.extra && 'content' in data.extra && 'thinkContent' in data.extra
  );
}

export const INIT_TEMPLATE_LIST: ChatMessageListOutputType = [
  { role: 'system', content: [] },
  { role: 'user', content: [] },
];
export const INIT_TITLE = '';
export const INIT_CONTEXT: ChatOptions = {
  input: {},
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
export type ChatValue = {
  default?: {
    input?: CHAT_ITEM_TYPE;
  };
  template?: {
    template: ChatMessageListInputType;
    contextValue?: WorkflowRunnerEnvironmentParams;
  };
  workflow?: {
    list: any[];
    invalidValue?: any;
    contextValue?: WorkflowRunnerEnvironmentParams;
  };
};
export type ChatConfig = { workflow?: { path?: string } };
const DefaultUserTemplate = [{ role: 'user', content: [] }];

@Component({
  selector: 'ai-chat',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    FormsModule,
    ChatCommonInput,
    MatTooltipModule,
    WorkflowChatResultComponent,
    CommonChatResultComponent,
    WorkflowInputComponent,
    InvalidForm,
    InputFormComponent,
    PromptListFCC,
  ],
  styleUrl: './component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChatComponent),
      multi: true,
    },
  ],
})
export class ChatComponent extends BaseControl<ChatValue> {
  override value$ = signal<ChatValue>({});
  mode = input<ChatMode>(ChatMode.workflow);
  modelConfigName = input<string>();
  config = input<ChatConfig>();
  stopSignal = input<{ clear: boolean }>();
  provider = inject(ChatService);
  readonly DefaultUserTemplate = DefaultUserTemplate;
  /** 通用对话历史 */
  readonly list$ = signal<CommonChat[]>([]);
  /** context/workflow */
  readonly chatResult$ = signal<WorkflowStreamData[] | undefined>(undefined);
  /** 通用输入 */
  disableInputObject = signal<Record<string, boolean>>({});
  // todo 暂时不能改,因为workflow是先设置的,而之前清空会导致都没了;可以改成内部切换?不用事件

  /** todo 需要修改  */
  codeAction = signal(false);
  #injector = inject(Injector);

  /** 是否切换为普通对话模式 */
  useChatType$$ = computed(() => {
    const mode = this.mode();
    if (mode === ChatMode.default || !!this.#lastChatResult()) {
      return ChatMode.default;
    }
    return mode;
  });
  /** 工作流配置 */
  invalidConfigList$ = signal<WorkflowInvalidConfig[]>([]);
  contextConfigList$ = signal<WorkflowContextConfig[]>([]);

  #workflowData = signal<
    (WorkflowData & { define: ResolvedWorkflow }) | undefined
  >(undefined);
  invalidValue$ = computed(() => this.value$().workflow?.invalidValue);
  contextValue$ = computed(() => this.value$().workflow?.contextValue);

  #lastChatResult = computed(() => {
    return this.chatResult$()
      ?.slice()
      .reverse()
      .find((item) => isChatStream(item));
  });
  override writeValue(obj: any) {
    super.writeValue(obj ?? {});
  }
  /** 使用普通对话历史,还是context/workflow返回的历史 */
  readonly #nextChatHistory$ = computed(() => {
    const lastItem = this.list$().at(-1);
    if (lastItem) {
      return lastItem.historyList;
    }
    const item = this.#lastChatResult();
    return item?.extra!.historyList || [];
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.valueAndTouchedChange({});
    }
    if (changes['stopSignal'] && this.stopSignal()) {
      let stopSignal = this.stopSignal()!;
      this.#chatRef?.unsubscribe();

      if (stopSignal.clear) {
        this.valueAndTouchedChange({});
        this.list$.set([]);
      }
    }
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
          modelConfigName: this.modelConfigName(),
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

  #chatTemplate() {
    return new Promise<void>(async (resolve) => {
      this.#chatRef = this.#client.ai.agentChat.subscribe(
        {
          context: this.value$().template!.contextValue!,
          template: this.value$().template!.template!,
          modelConfigName: this.modelConfigName(),
        },
        this.chatOneResponseFactory(resolve),
      );
    });
  }
  #chatWorkflow() {
    return new Promise<void>(async (resolve) => {
      this.#chatRef = this.#client.workflow.chat.subscribe(
        {
          input: {
            inputs: this.invalidValue$(),
            environmentParameters: this.contextValue$(),
          },
          data: this.#workflowData()!,
          modelConfigName: this.modelConfigName(),
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
          await this.commonChat(
            this.value$().default!.input!,
            historyList,
            length,
          );
          break;
        }
        case ChatMode.template: {
          await this.#chatTemplate();
          break;
        }
        case ChatMode.workflow: {
          await this.#chatWorkflow();
          break;
        }
        default:
          break;
      }
    } catch (error) {
    } finally {
      this.loading$.set(false);
    }
  }

  #client = inject(TrpcService).client;

  templateListChange(list: any) {
    this.value$.update((v) => {
      return { template: { ...v.template!, template: list } };
    });
  }
  variableChanged(list: ChatVariable[]) {
    this.contextConfigList$.set(
      list.map((item) => {
        return { kind: item.kind, key: item.value, label: item.label };
      }),
    );
  }
  chatDefaultChange(input: any) {
    this.value$.update((value) => {
      return {
        default: { ...value.default, input: input },
      };
    });
  }
  invalidValueChanged(value: any) {
    this.value$.update((v) => ({
      workflow: { ...v.workflow!, invalidValue: value },
    }));
  }
  contextValueChanged(value: WorkflowRunnerEnvironmentParams) {
    if (this.mode() === ChatMode.workflow) {
      this.value$.update((v) => ({
        workflow: { ...v.workflow!, contextValue: value },
      }));
    } else {
      this.value$.update((v) => ({
        template: { ...v.template!, contextValue: value },
      }));
    }
  }
}
