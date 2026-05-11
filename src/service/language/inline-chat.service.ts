import { inject, RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import { ChatService } from '../ai/chat.service';
// 目前就是占位符,感觉用处不大
export class InlineChatService
  extends RootStaticInjectOptions
  implements vscode.LanguageModelChatProvider2
{
  #chat = inject(ChatService);
  modelList: vscode.LanguageModelChatInformation[] = [];
  async provideLanguageModelResponse(...args: any[]) {
    // console.log('provideLanguageModelResponse', args);
  }
  async provideTokenCount(...args: any[]) {
    // console.log('provideTokenCount', args);
    return 0;
  }
  async prepareLanguageModelChat(...args: any[]) {
    // console.log('prepareLanguageModelChat', args);
    return this.modelList;
  }
  async provideLanguageModelChatResponse(...args: any[]) {
    // console.log('provideLanguageModelChatResponse', args);
  }
}
