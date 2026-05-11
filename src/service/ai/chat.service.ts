import { BehaviorSubject } from 'rxjs';
import { RootStaticInjectOptions, inject } from 'static-injector';
import { PromptItem } from './prompt.type';
import { ExtensionConfig } from '../config.service';
import { ChatProviderService } from '@shenghuabi/openai';
import { ChatModelOptions } from '@shenghuabi/openai';
import { omitBy } from 'lodash-es';
import { LogFactoryService } from '../log.service';
import { deepClone, isEmptyInput, isTruthy } from '@cyia/util';
import { ChatMetadata } from '@shenghuabi/workflow';

export class ChatService extends RootStaticInjectOptions {
  /** @internal */
  changePrompt$ = new BehaviorSubject<
    | {
        from: string;
        item?: PromptItem;
        type: 'edit' | 'add';
      }
    | undefined
  >(undefined);
  /** @internal */
  changedIndex?: number;
  /** llm请求 */
  // 配置自动更新
  #chatProvider = inject(ChatProviderService);
  #channel = inject(LogFactoryService).getLog('chat');
  async chat(config?: Partial<ChatModelOptions>) {
    this.#channel.info('传入对话配置', config);
    let model = ExtensionConfig.chatModelList()[0];
    this.#channel.info('默认配置', model);
    return this.#chatProvider.create({
      ...model,
      ...omitBy(config, isEmptyInput),
    } as any);
  }

  getModelConfig(name?: string) {
    if (!name) {
      return;
    }
    const list = ExtensionConfig.chatModelList();
    if (!list) {
      return;
    }
    return deepClone(list.find((item) => item.name === name));
  }
  getMetadataEndRef(list?: ChatMetadata[]) {
    if (!list || !list.length) {
      return undefined;
    }
    const result = list
      .map((item, index) =>
        item.reference?.type === 'url'
          ? `[${index}]: ${item.reference.url}`
          : undefined,
      )
      .filter(isTruthy);
    if (!list.length) {
      return undefined;
    }
    return '\n\n' + result.join('\n\n');
  }
}
