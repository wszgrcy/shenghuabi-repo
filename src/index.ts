import * as vscode from 'vscode';
import {
  ChangeDetectionScheduler,
  ChangeDetectionSchedulerImpl,
  Injector,
  computed,
  createInjector,
  createRootInjector,
  effect,
  inject,
} from 'static-injector';
import { WebViewMessageService } from './trpc';
import { WebviewMapService } from './webview/webview.map';
import { DynamicInjectToken, ExtensionContext } from './token';
import { HanyuService } from './service/language';
import { CommandService } from './service/command.service';
import { AiChatProvider } from './webview/custom-sidebar/ai-chat.service';
import { PromptTree } from './webview/custom-sidebar/prompt.tree';
import { ChatHistoryTree } from './webview/custom-sidebar/chat/chat.history.tree';
import { MindEditorProvider } from './webview/custom-editor/mind-editor2';
import { KnowledgeCreateProvider } from './webview/custom-sidebar/knowledge/knowledge-create.service';
import { KnowledgeTree } from './webview/custom-sidebar/knowledge/knowledge.tree';
import { KnowledgeFileSystem } from './webview/common-webview/knowledge.fs';
import { FlowVirtualFileSystem } from './webview/common-webview/flow.vfs';
import { WatchService } from './service/fs/watch.service';
import { FileService } from './service/language/file.service';
import { Text2VecService } from './service/external-call/text2vec.service';
import { FolderTree } from './webview/tree/folder.tree';
import { ExtensionConfig } from './service/config.service';
import { WorkflowEditorProvider } from './webview/custom-editor/workflow-editor';
import { WorkflowTree } from './webview/tree/workflow.tree';
import { SentenceDiffSystem } from './service/language/sensitive-word/sensitive-word.diff';
import { EventService } from './service/event.service';
import { DictImportProvider } from './webview/custom-sidebar/knowledge/dict-import.service';
import { KnowledgeQueryWebviewProvider } from './webview/custom-sidebar/knowledge-query/query.service';
import { KnowledgeQueryResultTree } from './webview/custom-sidebar/knowledge-query/result.tree';
import { MindTree } from './webview/custom-sidebar/mind/mind.tree';
import { OCRService } from './service/external-call/ocr.service';
import { QuickPickWebviewProvider } from './webview/custom-sidebar/quick-pick/quick-pick.service';
import { ScriptEditorFileSystem } from './service/script-editor/script-editor';
import { CustomAITextSearchProvider } from './service/ai/ai-text-search.provider';
import { CorrectionService } from './service/language/correction.service';
import {
  DocumentFileParserService,
  DocumentParserConfigToken,
  FileParserService,
  FileParserToken,
  ImageParserToken,
} from '@shenghuabi/knowledge/file-parser';
// import { WebGpuBrowserWindowService } from './native';
import { ImageParserService } from './service/file-parser/image.parser';
import {
  QdrantClientService,
  QdrantOptionsToken,
  QdrantServerService,
  QdrantStartToken,
} from '@shenghuabi/knowledge/qdrant';
import { PluginService } from './service/plugin/plugin.service';
import { CustomKnowledgeManagerService } from './service/knowledge/custom-knowledge.manager.service';
import {
  ArticleKnowledgeService,
  ConfigToken,
  ContentParserToken,
  DictKnowledgeService,
  DirToken,
  GraphKnolwdgeService,
  NormalKnowledgeService,
  Text2VecToken,
  TextSplitterToken,
} from '@shenghuabi/knowledge/knowledge';
import { ChatService } from './service/ai/chat.service';
import { LogToken } from '@shenghuabi/knowledge/util';
import { ChatUtilService } from './service/util/chat.util.service';

import { ServerService } from './service/server/server.service';
import * as Sentry from '@sentry/node';
import '@valibot/i18n/zh-CN';
import * as v from 'valibot';
import { RagWorkflowParser } from './service/ai/rag/parse/workflow-parser';
import { ManifestFactoy } from './service/plugin/type';

import { LLamaConfigToken, LlamaSwapService } from '@shenghuabi/llama';
import {
  LogFactoryToken,
  LogService as ECLogService,
  HUGGINGFACE_URL_TOKEN,
  DownloadConfigToken,
  HUGGINGFACE_TOKEN_TOKEN,
} from '@cyia/external-call';
import { FolderName, WorkspaceService } from './service/workspace.service';
import { LogFactoryService } from './service/log.service';
import { LlamaSwapBridgeService } from './service/external-call/llama-swap-bridge.service';
import { GITHUB_URL_TOKEN } from '@cyia/external-call';
import {
  IndexTTSService,
  TTSSerivce,
  SplitService,
  ConfigManagerService,
  PythonAddonConfigToken,
  IndexTTSV2Service,
  IndexTTSConfigToken,
  TTSConfigToken,
} from '@shenghuabi/python-addon';
import { ReRankerService } from './service/external-call/ranker/ranker.service';

import { OPENAI_MODULE, OpenAIConfig } from '@shenghuabi/openai';
import { captureException } from '@sentry/node';
import { TTSEditorProvider } from './webview/custom-editor/tts-editor';
import { LLMLauncherService } from './service/llm.launcher.service';
import { isString } from 'lodash-es';
import { deepClone } from '@cyia/util';
import { createMessage2Log } from '@cyia/dl';
import { DownloadService } from './service/download.service';
import {
  ChatServiceToken,
  InlineNodeService,
  NodeRunnerBase,
  WORKFLOW_MODULE,
  WorkflowConfigToken,
  WorkflowExecService,
  WorkflowSelectService,
} from '@shenghuabi/workflow';
import { WorkflowNativeSelectService } from './native/workflow-select.service';
import { EditorWorkflowService } from './service/editor-workflow.service';
import * as InlineDefine from './service/worflow/define/index.main';

// todo 需要判断环境使用
v.setGlobalConfig({ lang: 'zh-CN' });
let injector: Injector;
let llamaService: LlamaSwapService;
export async function activate(context: vscode.ExtensionContext) {
  if (TEST_ENV) {
    return;
  }
  // 设置监听
  Sentry.init({
    dsn: 'https://f8d6123f25734f38b3e837a88b56493f@debug.shenghuabi.top/1',
    maxBreadcrumbs: 0,
    ignoreErrors: ['backend not found', /^(\s+)?Canceled(\s+)?$/],
    // beforeSend(event, hint) {
    //   console.log('报告', event);
    //   return null;
    // },
  });
  Sentry.getGlobalScope().setExtra('版本', process.env['PUBLISH_VERSION']);

  injector = createRootInjector({
    providers: [
      // 工作流相关
      ...WORKFLOW_MODULE.provider,
      WorkflowNativeSelectService,
      { provide: ChatServiceToken, useClass: ChatService },
      {
        provide: WorkflowConfigToken,
        useFactory: () => {
          const workspace = inject(WorkspaceService);
          return computed(() => ({
            dir: workspace.dir[FolderName.workflowDir](),
          }));
        },
      },
      // 文档解析
      {
        provide: DocumentParserConfigToken,
        useValue: computed(() => {
          return {
            pdfAsImage: ExtensionConfig.pdfAsImage(),
          };
        }),
      },
      {
        provide: ImageParserToken,
        useFactory: () => {
          const workflowExec = inject(WorkflowExecService);
          const editorWorkflowService = inject(EditorWorkflowService);
          return async (filePath: string, prefix: string, image: Buffer) => {
            const setResult = await editorWorkflowService.workflowConfigSet(
              'image',
              false,
            );
            if (!setResult) {
              return { content: '[[工作流未选择]]' };
            }
            const workflow = await editorWorkflowService.getWorkflow('image');
            const result = await workflowExec.exec(
              workflow,
              {
                environmentParameters: {
                  filePath,
                  prefix,
                  image,
                },
              },
              { showError: true },
            );
            return {
              content: result.value,
              parseTo: result.extra?.data.format,
            };
          };
        },
      },
      DownloadService,
      OPENAI_MODULE.provider,
      {
        provide: HUGGINGFACE_TOKEN_TOKEN,
        useValue: ExtensionConfig.hfToken,
      },
      {
        provide: OPENAI_MODULE.token.OpenAIConfigToken,
        useFactory: () => {
          const llama = inject(LlamaSwapService);
          const workspace = inject(WorkspaceService);
          const channel = inject(LogFactoryService).getLog('llama.cpp');
          return computed(
            () =>
              ({
                tryPull: (error: any) => {
                  if (llama.start$()) {
                    if (
                      error instanceof Error &&
                      'error' in error &&
                      isString(error.error) &&
                      error.error.includes('could not find real')
                    ) {
                      return true;
                    }
                  }
                  return false;
                },
                // 这里改llama.cpp
                pullModel: async (name: string) => {
                  if (llama.start$()) {
                    const progressLog = createMessage2Log();
                    const result = await llama.createModelConfig(name, {
                      progressMessage: (message) => {
                        const result = progressLog(message);
                        if (result) {
                          channel.info(result.message);
                        }
                      },
                    });
                    const version =
                      ExtensionConfig['llama-swap.install'].llamaVersion();
                    let oldServer = deepClone(
                      ExtensionConfig['llama.config'].server(),
                    );
                    oldServer = {
                      ...oldServer,
                      list: [
                        ...(oldServer.list ?? []),
                        {
                          ...result,
                          exec: {
                            version: version,
                            device: 'vulkan',
                          },
                        },
                      ],
                    };

                    await ExtensionConfig['llama.config'].server.set(oldServer);
                    await new Promise<void>((resovle) => {
                      // 因为下载完后还会触发第二次写入,暂时性修复
                      setTimeout(() => {
                        resovle();
                      }, 10_000);
                    });
                  }
                  return;
                },
                captureException(error) {
                  captureException(error);
                },
                history: {
                  enable: ExtensionConfig.chatHistory.enable(),
                  dir: workspace.dir[FolderName.chatHistory](),
                },
              }) as OpenAIConfig,
          );
        },
      },
      WebViewMessageService,
      WebviewMapService,
      TTSSerivce,
      IndexTTSService,
      IndexTTSV2Service,
      SplitService,
      ConfigManagerService,
      ReRankerService,
      QdrantServerService,
      {
        provide: PythonAddonConfigToken,
        useValue: computed(() => {
          return {
            ...ExtensionConfig.pythonAddon(),
            dir: injector.get(WorkspaceService).dir[FolderName.pythonAddon](),
          };
        }),
      },
      LlamaSwapService,
      LlamaSwapBridgeService,
      {
        provide: LLamaConfigToken,
        useValue: computed(() => {
          const dir = injector.get(WorkspaceService).dir[FolderName.llamaDir]();
          return {
            dir: dir,
            listen: ExtensionConfig['llama.listen'](),
          };
        }),
      },
      {
        provide: GITHUB_URL_TOKEN,
        useValue: computed(() => {
          return ExtensionConfig.download.direct()
            ? 'github.com'
            : ExtensionConfig.download.softwareMirror();
        }),
      },
      {
        provide: IndexTTSConfigToken,
        useValue: ExtensionConfig.indexTTS,
      },
      {
        provide: TTSConfigToken,
        useValue: ExtensionConfig.tts,
      },
      {
        provide: HUGGINGFACE_URL_TOKEN,
        useValue: computed(() => {
          return ExtensionConfig.download.direct()
            ? 'huggingface.co'
            : ExtensionConfig.download.huggingfaceModelMirror();
        }),
      },

      {
        provide: DownloadConfigToken,
        useValue: ExtensionConfig.download.strategy,
      },
      {
        provide: LogFactoryToken,
        useValue: (value: 'llama.cpp' | 'TTS') => {
          const instance = injector.get(LogFactoryService).getLog(value);
          return {
            info: (...args: any[]) => {
              instance.info(...args);
            },
            warn: (...args: any[]) => {
              instance.warn(...args);
            },
            error: (...args: any[]) => {
              instance.failed(...args);
            },
          };
        },
      },

      ECLogService,
      { provide: ExtensionContext, useValue: context },
      LLMLauncherService,
      {
        provide: ChangeDetectionScheduler,
        useClass: ChangeDetectionSchedulerImpl,
      },

      {
        provide: QdrantOptionsToken,
        useFactory: () => {
          const workspace = inject(WorkspaceService);
          return computed(() => {
            return {
              ...ExtensionConfig.vector_database(),
              dir: workspace.dir[FolderName.qdrantDir](),
            };
          });
        },
      },
      { provide: QdrantStartToken, useValue: Promise.withResolvers<void>() },
      {
        provide: DynamicInjectToken,
        useValue: computed(() => {
          return createInjector({
            providers: [
              CustomKnowledgeManagerService,
              FileParserService,
              {
                provide: FileParserToken,
                useClass: DocumentFileParserService,
                multi: true,
              },
              {
                provide: FileParserToken,
                useClass: ImageParserService,
                multi: true,
              },
              ...injector.get(PluginService).rootProviderList$$(),
            ],
            parent: injector,
          });
        }),
      },
    ],
  });
  injector.get(InlineNodeService).register(InlineDefine);
  injector.get(CommandService).init();
  init(context);
  injector.get(HanyuService).init();
  injector.get(EventService).init();

  // await vscode.workspace.fs.createDirectory(
  //   vscode.Uri.file(path.join(__dirname, '.cache')),
  // );

  injector.get(CorrectionService).init();

  // vscode.window.registerCustomEditorProvider(
  //   'shenghuabi.WYSIWYG.editor',
  //   injector.get(RichEditor),
  // );
  vscode.window.registerCustomEditorProvider(
    MindEditorProvider.viewType,
    injector.get(MindEditorProvider),
    {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false,
    },
  );
  vscode.window.registerCustomEditorProvider(
    TTSEditorProvider.viewType,
    injector.get(TTSEditorProvider),
    {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false,
    },
  );
  vscode.window.registerCustomEditorProvider(
    WorkflowEditorProvider.viewType,
    injector.get(WorkflowEditorProvider),
    {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false,
    },
  );

  // 敏感词对比系统
  vscode.workspace.registerFileSystemProvider(
    SentenceDiffSystem.scheme,
    injector.get(SentenceDiffSystem),
    {
      isReadonly: false,
      isCaseSensitive: true,
    },
  );
  vscode.workspace.registerFileSystemProvider(
    ScriptEditorFileSystem.scheme,
    injector.get(ScriptEditorFileSystem),
    {
      isReadonly: false,
      isCaseSensitive: true,
    },
  );
  // ai对话
  vscode.window.registerWebviewViewProvider(
    AiChatProvider.viewType,
    injector.get(AiChatProvider),
    {
      webviewOptions: { retainContextWhenHidden: true },
    },
  );
  // 知识库创建
  vscode.window.registerWebviewViewProvider(
    KnowledgeCreateProvider.viewType,
    injector.get(KnowledgeCreateProvider),
    {
      webviewOptions: { retainContextWhenHidden: true },
    },
  );
  // 字典导入
  vscode.window.registerWebviewViewProvider(
    DictImportProvider.viewType,
    injector.get(DictImportProvider),
    {
      webviewOptions: { retainContextWhenHidden: true },
    },
  );
  vscode.window.registerWebviewViewProvider(
    KnowledgeQueryWebviewProvider.viewType,
    injector.get(KnowledgeQueryWebviewProvider),
    {
      webviewOptions: { retainContextWhenHidden: true },
    },
  );
  vscode.window.registerWebviewViewProvider(
    QuickPickWebviewProvider.viewType,
    injector.get(QuickPickWebviewProvider),
    {
      webviewOptions: { retainContextWhenHidden: true },
    },
  );

  vscode.window.registerTreeDataProvider(
    KnowledgeQueryResultTree.viewType,
    injector.get(KnowledgeQueryResultTree),
  );
  // 提示词模板
  vscode.window.registerTreeDataProvider(
    PromptTree.viewId,
    injector.get(PromptTree),
  );
  vscode.window.registerTreeDataProvider(
    ChatHistoryTree.viewId,
    injector.get(ChatHistoryTree),
  );
  vscode.window.registerTreeDataProvider(
    WorkflowTree.viewType,
    injector.get(WorkflowTree),
  );
  vscode.window.registerTreeDataProvider(
    KnowledgeTree.viewType,
    injector.get(KnowledgeTree),
  );
  vscode.window.registerTreeDataProvider(
    FolderTree.viewType,
    injector.get(FolderTree),
  );
  vscode.window.registerTreeDataProvider(
    MindTree.viewType,
    injector.get(MindTree),
  );
  injector.get(MindTree).listen();
  // 文件监听
  injector.get(WatchService).init();
  injector.get(FileService).init();
  injector.get(Text2VecService).init();

  if (ExtensionConfig['llama.startup']()) {
    llamaService = injector.get(LlamaSwapService);
    await llamaService.init();
  }
  injector.get(LlamaSwapBridgeService).init();
  injector.get(OCRService).init();
  vscode.workspace.registerFileSystemProvider(
    FlowVirtualFileSystem.scheme,
    injector.get(FlowVirtualFileSystem),
    {
      isReadonly: true,
      isCaseSensitive: true,
    },
  );
  const qdrantService = injector.get(QdrantServerService);
  qdrantService.init();

  // 单独启动，不阻塞插件

  const ref = effect(
    () => {
      const data = qdrantService.start$();
      if (!data) {
        return;
      }
      ref.destroy();
      vscode.workspace.registerFileSystemProvider(
        KnowledgeFileSystem.scheme,
        injector.get(KnowledgeFileSystem),
        {
          isReadonly: false,
          isCaseSensitive: true,
        },
      );
    },
    { injector },
  );
  // ctrl+p用到,可以用于卡片查询
  // vscode.workspace.registerFileSearchProvider2('file', {
  //   provideFileSearchResults(query, options, progress) {
  //     console.log('查询了??', query, options);
  //     return [];
  //   },
  // });
  vscode.workspace.registerAITextSearchProvider(
    CustomAITextSearchProvider.scheme,
    injector.get(CustomAITextSearchProvider),
  );
  injector.get(ServerService).init();
  return {
    dispose$$: async () => {
      return Promise.all([
        (async () => {
          try {
            await qdrantService.stop();
          } catch (error) {}
        })(),

        (async () => {
          try {
            await llamaService.stop();
          } catch (error) {}
        })(),
      ]);
    },
    exports: {
      register: (uri: any, config: ManifestFactoy) => {
        return injector.get(PluginService).register(
          uri,
          config({
            inject,
            Injector,
            // todo 导出一个tts注册
            provider: {
              root: {
                injector,
                FileParserToken,
                ChatService,
                FileParserService,
                KnowledgeManagerService: CustomKnowledgeManagerService,
                OCRService,
                ChatUtilService,
                WorkflowSelectService,
                WorkflowExecService,
                LLMLauncherService,
                TTSSerivce,
                WorkspaceService,
              },
              knowledge: {
                QdrantClientService,
                DictKnowledgeService,
                NormalKnowledgeService,
                GraphKnolwdgeService,
                ArticleKnowledgeService,
                Text2VecToken,
                TextSplitterToken,
                ConfigToken,
                DirToken,
                LogToken,
                ContentParserToken,
                RagWorkflowParser,
              },
              workflow: {
                NodeRunnerBase,
              },
            },
          }),
        );
      },
    },
  };
}

function init(context: vscode.ExtensionContext) {
  // let fileName = `extension.inited`;
  // let isExist = fs.existsSync(path.join(context.extensionPath, fileName));
  // if (!isExist) {
  //   fs.writeFileSync(
  //     path.join(context.extensionPath, fileName),
  //     Buffer.from(''),
  //   );
  //   return vscode.commands.executeCommand(`workbench.action.reloadSoftwave`);
  // }
  const dir = ExtensionConfig.defaultDir();
  const workspace = vscode.workspace.workspaceFolders;

  if (!workspace || !workspace.length || !dir) {
    vscode.commands.executeCommand(`shenghuabi.help`);
    return true;
  }
  return false;
}
