import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  ChatComponent,
  ChatValue,
  getDefaultChatConfig,
  INIT_TITLE,
} from '../../component/chat/component';
import { TrpcService } from '@fe/trpc';
import { deepClone } from '../../util/clone';
import { ChatService } from '@fe/component/chat/chat.service';
import { ChatMode, ChatOptions } from '@bridge/share';
import { isUndefined, omitBy } from 'lodash-es';
import { MenuCheckboxFCC } from '@cyia/component/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
/**
 * 侧边栏页面
 */
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [ChatComponent, MenuCheckboxFCC, FormsModule, MatTooltipModule],
  providers: [ChatService],
})
export default class AiChatPage {
  comp = viewChild.required<ChatComponent>('aiChat');
  #client = inject(TrpcService).client;
  mode = signal<ChatMode>(ChatMode.default);
  modelConfigName = signal<string | undefined>(undefined);
  config = signal<{ workflow?: { path?: string } }>({});
  title$ = signal('');
  value$ = signal<ChatValue>({});
  stopSignal = signal<{ clear: boolean } | undefined>(undefined);

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
              this.config.update(() => {
                return { workflow: { path: value } };
              });
              return true;
            }
            return false;
          });
      },
    },
  ];
  menuTooltip$$ = computed(() => {
    return this.mode() === ChatMode.workflow
      ? `\n工作流: ${this.config().workflow?.path || ''}`
      : '';
  });
  constructor() {
    // 代码编辑
    this.#client.ai.codeAction.subscribe(undefined, {
      onData: async (result) => {},
    });
    // 编辑某个存在时触发
    this.#client.chat.dataChange.subscribe(undefined, {
      onData: async (data) => {},
    });
    this.#client.command.listen.subscribe('promptTemplateSave', {
      onData: (list) => {},
    });
  }
  changeModelConfigName() {
    this.#client.chat.getChatModelConfigName
      .query(undefined)
      .then((configName) => {
        if (!configName) {
          return;
        }
        this.modelConfigName.set(configName);
      });
  }
  reset(clear: boolean) {
    this.stopSignal.set({ clear });
  }
  chatValueChange(value: ChatValue) {
    console.log(value);
  }
}
