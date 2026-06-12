import { Component, computed, inject, signal } from '@angular/core';
import { ChatComponent, ChatValue } from '../../component/chat/component';
import { TrpcService } from '@fe/trpc';
import { ChatService } from '@fe/component/chat/chat.service';
import { ChatMode } from '@bridge/share';
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
  #client = inject(TrpcService).client;
  mode = signal<ChatMode>(ChatMode.default);
  modelConfigName = signal<string | undefined>(undefined);
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
          .query({})
          .then((value) => {
            if (!value) {
              return false;
            }
            this.value$.update((data) => {
              return {
                workflow: {
                  ...data.workflow!,
                  path: value,
                },
              };
            });

            return true;
          });
      },
    },
  ];
  menuTooltip$$ = computed(() => {
    return this.mode() === ChatMode.workflow
      ? `\n工作流: ${this.value$().workflow?.path || ''}`
      : '';
  });
  constructor() {

 

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
    this.value$.set(value);
  }
}
