import { inject, RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';

// 目前就是占位符,感觉用处不大
export class InlineChatService extends RootStaticInjectOptions {
  createProvider(provider: vscode.LanguageModelChatProvider) {
    return provider;
  }
}
