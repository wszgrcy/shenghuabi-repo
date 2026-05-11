import { Component, inject, viewChild } from '@angular/core';
import {
  ChatComponent,
  getDefaultChatConfig,
  INIT_TITLE,
} from '../../component/chat/component';
import { TrpcService } from '@fe/trpc';
import { deepClone } from '../../util/clone';
import { ChatService } from '@fe/component/chat/chat.service';
import { ChatMode, ChatOptions, DEFAULT_INPUT_KEY } from '@bridge/share';
import { isUndefined, omitBy } from 'lodash-es';
/**
 * 侧边栏页面
 */
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [ChatComponent],
  providers: [ChatService],
})
export default class AiChatPage {
  comp = viewChild.required<ChatComponent>('aiChat');
  #client = inject(TrpcService).client;

  constructor() {
    // 代码编辑
    this.#client.ai.codeAction.subscribe(undefined, {
      onData: async (result) => {
        await this.comp().reset(true);
        this.comp().codeAction.set(true);
        this.comp().title.set(result.title);
        const data = deepClone(result);
        delete (data as any).title;
        if (data.mode === ChatMode.template) {
          data.input = data.input?.[DEFAULT_INPUT_KEY];
        }
        this.comp().firstItem$.set({
          ...getDefaultChatConfig(data?.mode || ChatMode.default),
          ...data,
        });
        this.comp().chatAll();
      },
    });
    // 编辑某个存在时触发
    this.#client.chat.dataChange.subscribe(undefined, {
      onData: async (data) => {
        await this.comp().reset(true);
        if (data?.from === 'history') {
          this.comp().firstItem$.set({
            mode: ChatMode.default,
          });
          const cList = [];
          for (let index = 0; index < data.item!.template!.length; index++) {
            const chatItem = data.item!.template![index];
            if (
              chatItem.role === 'user' &&
              data.item!.template![index + 1].role === 'assistant'
            ) {
              cList.push({
                input: chatItem.content,
                historyList: data.item!.template!.slice(0, index + 2),
                result: data.item!.template![index + 1],
              });
            }
          }
          this.comp().list$.set(cList as any);
          return;
        }
        const item = (data?.item ?? {}) as any;
        if (Array.isArray(item.context) || !item.context) {
          item.context = {};
        }

        // 只有模板。输入需要自己搞
        this.comp().title.set(item?.title || INIT_TITLE);
        delete (item as any)?.title;
        this.comp().firstItem$.set({
          ...getDefaultChatConfig(item?.mode || ChatMode.default),
          ...item,
        });
      },
    });
    this.#client.command.listen.subscribe('promptTemplateSave', {
      onData: (list) => {
        const result = omitBy(
          this.comp().firstItem$(),
          isUndefined,
        ) as any as ChatOptions;

        if (result.input) {
          result.input = omitBy(result.input, isUndefined);
          if (!Object.keys(result.input).length) {
            delete result.input;
          }
        }
        if (result.context) {
          result.context = omitBy(result.context, isUndefined);
          if (!Object.keys(result.context).length) {
            delete result.context;
          }
        }
        this.#client.chat.savePromptTemplate.query({
          ...result,
          title: this.comp().title(),
        });
      },
    });
  }
}
