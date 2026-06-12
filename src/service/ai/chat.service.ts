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

export class ChatService extends RootStaticInjectOptions {
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
}
