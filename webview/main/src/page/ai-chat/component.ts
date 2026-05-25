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
        switch (result.from) {
          case 'commonChat': {
            if (!result.item) {
              return;
            }
            this.title$.set(result.item?.title ?? '');
            this.mode.set(result.item.mode);
            this.modelConfigName.set(result.item.modelConfigName);
            switch (this.mode()) {
              case ChatMode.workflow: {
                break;
              }
              case ChatMode.template: {
                let template = await Promise.all(
                  result.item.template?.map(async (item) => {
                    return {
                      role: item.role,
                      content: await Promise.all(
                        item.content.map(async (data) => {
                          if (data.type === 'text') {
                            return {
                              type: data.type,
                              text: (
                                await this.#client.workflow.parseTemplate.query(
                                  {
                                    content: data.text,
                                  },
                                )
                              ).list,
                            };
                          } else {
                            return {
                              type: data.type,
                              image_url: {
                                url: (
                                  await this.#client.workflow.parseTemplate.query(
                                    {
                                      content: data.image_url.url,
                                    },
                                  )
                                ).list,
                              },
                            };
                          }
                        }),
                      ),
                    };
                  }) ?? [],
                );
                if (!template) {
                  return;
                }
                console.log('xxxx', template);
                this.value$.set({ template: { template: template as any } });

                break;
              }
              case ChatMode.default: {
                break;
              }
            }
            this.value$;
            break;
          }

          default:
            break;
        }
      },
    });
    this.#client.command.listen.subscribe('promptTemplateSave', {
      onData: (result) => {
        console.log('cc', result);
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
    console.log(value);
  }
}
