import { RootStaticInjectOptions } from 'static-injector';
import { ExtensionConfig } from '../config.service';

import { deepClone } from '@cyia/util';
import { ModelConfigInputType } from '@shenghuabi/openai';
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
