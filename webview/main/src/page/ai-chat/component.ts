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
          .query(undefined)
          .then((value) => {
            if (value) {
              this.value$.update((data) => {
                return {
                  workflow: {
                    ...data.workflow!,
                    path: value,
                  },
                };
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
      ? `\n工作流: ${this.value$().workflow?.path || ''}`
      : '';
  });
  constructor() {
    // 代码编辑
    this.#client.ai.codeAction.subscribe(undefined, {
      onData: async (result) => {
        console.log('aa', result);
      },
    });
    // 编辑某个存在时触发
    this.#client.chat.dataChange.subscribe(undefined, {
      onData: async (result) => {
        if (!result) {
          return;
        }
        if (!result.item) {
          return;
        }
        this.title$.set(result.item?.title ?? '');
        this.mode.set(result.item.mode);
        this.modelConfigName.set(result.item.modelConfigName);
        switch (this.mode()) {
          case ChatMode.workflow: {
            this.value$.set({
              workflow: result.item.workflow! as any,
            });
            break;
          }
          case ChatMode.template: {
            const template = await this.#client.workflow.convertChat.query({
              list: result.item.template ?? [],
            });

            if (!template) {
              return;
            }
            this.value$.set({ template: { template: template as any } });

            break;
          }
          case ChatMode.default: {
            break;
          }
        }
      },
    });
    this.#client.command.listen.subscribe('promptTemplateSave', {
      onData: async (listx) => {
        const obj = {} as Record<string, any>;
        if (this.mode() === ChatMode.template) {
          const content = await Promise.all(
            this.value$().template!.template.map(async (item) => {
              return {
                role: item.role,
                content: await Promise.all(
                  item.content.map(async (data) => {
                    if (data.type === 'text') {
                      return {
                        type: data.type,
                        text: await this.#client.workflow.unParseTemplate.query(
                          {
                            content: data.text,
                          },
                        ),
                      };
                    } else {
                      return {
                        type: data.type,
                        image_url: {
                          url: await this.#client.workflow.unParseTemplate.query(
                            {
                              content: data.image_url.url,
                            },
                          ),
                        },
                      };
                    }
                  }),
                ),
              };
            }),
          );
          obj['template'] = content;
        } else if (this.mode() === ChatMode.workflow) {
          obj['workflow'] = this.value$().workflow;
        } else {
          return;
        }
        this.#client.chat.savePromptTemplate.query({
          title: this.title$(),
          mode: this.mode(),
          modelConfigName: this.modelConfigName(),
          ...obj,
        });
      },
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
    this.value$.set(value);
  }
}
