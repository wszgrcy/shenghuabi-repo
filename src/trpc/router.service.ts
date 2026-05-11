import { Injector, inject } from 'static-injector';
import { t } from './t';
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createIPCHandler } from '@cyia/vscode-trpc/server';
import { Webview } from 'vscode';
import { DocumentRouter } from './document.router';
import { AiRouter } from './ai.router';
import { FsRouter } from './fs.router';
import { ChatRouter } from './chat.router';
import { CommandRouter } from './command.router';
import { MindRouter } from './mind.router';
import { KnowledgeRouter } from './knowledge.router';
import { EnvironmentConfigurationRouter } from './configuration.router';
import { WorkflowRouter } from './workflow.router';
import { IdAssetRouter } from './id-asset.router';
import { RequestRouter } from './request.router';
import { AssetsRouter } from './assets.router';
import { CommonRouter } from './common.router';
import { TTSRouter } from './tts.router';
import { PluginConfigRouter } from './plugin.router';
export class WebViewMessageService {
  injector = inject(Injector);
  handler;
  constructor() {
    this.handler = createIPCHandler({
      router: this.getRouter(),
      createContext: async (options) => ({
        ...options,
        injector: this.injector,
      }),
    });
  }
  addWebView(
    webview: Webview,
    extraContext?: Record<string, any>,
    compress?: Record<string, boolean>,
  ) {
    this.handler.addWebView(webview, extraContext, compress);
  }
  removeWebView(webview: Webview) {
    this.handler.removeWebView(webview);
  }
  getRouter() {
    return t.router({
      // config: ConfigRouter,
      document: DocumentRouter,
      ai: AiRouter,
      fs: FsRouter,
      common: CommonRouter,
      chat: ChatRouter,
      command: CommandRouter,
      mind: MindRouter,
      knowledge: KnowledgeRouter,
      environment: EnvironmentConfigurationRouter,
      workflow: WorkflowRouter,
      idAsset: IdAssetRouter,
      request: RequestRouter,
      assets: AssetsRouter,
      tts: TTSRouter,
      pluginConfig: PluginConfigRouter,
    });
  }
}

export type AppRouter = Awaited<ReturnType<WebViewMessageService['getRouter']>>;
export type APPInput = inferRouterInputs<AppRouter>;
export type APPOutput = inferRouterOutputs<AppRouter>;
