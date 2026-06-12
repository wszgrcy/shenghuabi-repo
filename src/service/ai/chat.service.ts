import { BehaviorSubject } from 'rxjs';
import { RootStaticInjectOptions, inject } from 'static-injector';
import { PromptItem } from './prompt.type';
import { ExtensionConfig } from '../config.service';

import { omitBy } from 'lodash-es';
import { LogFactoryService } from '../log.service';
import { deepClone, isEmptyInput, isTruthy } from '@cyia/util';
import { ChatMetadata } from '@shenghuabi/workflow';
import { create } from 'domain';
import { createChatStream, ModelConfigInputType } from '@shenghuabi/openai';
import { computed, signal } from 'static-injector';

export class ChatService extends RootStaticInjectOptions {
  /** 动态 */
  llamaSwapModelList$ = signal<ModelConfigInputType[]>([]);
  modelList$$ = computed(() => {
    return [...ExtensionConfig.chatModelList(), ...this.llamaSwapModelList$()];
  });
  getModelConfig(name?: string) {
    if (!name) {
      return;
    }
    const list = this.modelList$$();
    if (!list) {
      return;
    }
    return deepClone(list.find((item) => item.name === name));
  }
}
