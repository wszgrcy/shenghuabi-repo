import * as v from 'valibot';
import { t } from './t';
import { observable } from '@trpc/server/observable';
import { ExtensionConfig, GlobalAllConfig } from '../service/config.service';
import { FolderName, WorkspaceService } from '../service/workspace.service';
import {
  InstallMessage,
  InstallStatus,
  RunningStatus,
} from '../service/external-call/type';
import { Text2VecService } from '../service/external-call/text2vec.service';
import { ChatService } from '../service/ai/chat.service';
import { ChannelService } from '../service/channel.service';
import { ConfigurationTarget } from 'vscode';
import * as vscode from 'vscode';

import { WorkflowTree } from '../webview/tree/workflow.tree';
import { TransformersEmbeddingService } from '../service/external-call/embedding/transformers-embedding.service';
import { OCRService } from '../service/external-call/ocr.service';
import { path } from '@cyia/vfs2';
import { effect } from 'static-injector';
import { LlamaSwapService } from '@shenghuabi/llama';
import { createMessage2Log } from '@cyia/dl';
import { LogFactoryService } from '../service/log.service';
import {
  ConfigManagerService,
  TTSPluginSerivce,
  TTSSerivce,
} from '@shenghuabi/python-addon';
import { ReRankerService } from '../service/external-call/ranker/ranker.service';
import { createAsyncGeneratorAdapter } from '../share';
import { QdrantServerService } from '@shenghuabi/knowledge/qdrant';
import { LanguageMap } from '@shenghuabi/python-addon/define';

export const EnvironmentConfigurationRouter = t.router({
  saveDefaultDir: t.procedure
    .input(v.string())
    .query(async ({ input, ctx }) => {
      await ExtensionConfig.defaultDir.set(input);
      await GlobalAllConfig.update(
        'defaultDir',
        input,
        ConfigurationTarget.Global,
      );
      if (input) {
        // 工作流复制
        const workspace = ctx.injector.get(WorkspaceService);
        const data = workspace.formatPath(
          `{{extensionFolder}}/data/workflow/default`,
        );
        try {
          await vscode.workspace.fs.copy(
            vscode.Uri.file(data),
            vscode.Uri.file(path.join(input, 'workflow/default')),
            { overwrite: true },
          );
          ctx.injector.get(WorkflowTree).refresh();
        } catch (error) {}
        // 提示词复制
        {
          const presetFilePath = workspace.formatPath(
            `{{extensionFolder}}/data/prompt/common_prompt.yml`,
          );
          try {
            await vscode.workspace.fs.copy(
              vscode.Uri.file(presetFilePath),
              vscode.Uri.file(workspace.dir[FolderName.commonPromptDir]()),
              { overwrite: true },
            );
          } catch (error) {}
        }
        {
          const presetFilePath = workspace.formatPath(
            `{{extensionFolder}}/data/prompt/selection_prompt.yml`,
          );
          try {
            await vscode.workspace.fs.copy(
              vscode.Uri.file(presetFilePath),
              vscode.Uri.file(workspace.dir[FolderName.selectionPromptDir]()),
              { overwrite: true },
            );
          } catch (error) {}
        }
        ctx.injector.get(QdrantServerService).startup();
        ctx.injector.get(Text2VecService).check();
      }
    }),
  getDefaultDir: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    return ExtensionConfig.defaultDir() || '';
  }),

  getConfiguration: t.procedure.query(async ({ input, ctx }) => {
    const workspace = ctx.injector.get(WorkspaceService);
    const rerankerConfig = ExtensionConfig.reranker();

    let modelConfig = ExtensionConfig.chatModelList()[0];
    return {
      download: {
        direct: ExtensionConfig.download.direct(),
      },
      qdrant: {
        dir: workspace.dir[FolderName.qdrantDir](),
      },
      embedding: {
        startupBackend: ExtensionConfig.text2vec.startupType(),
        transformersConfig: {
          dir: workspace.dir[FolderName.text2vecDir](),
          modelName:
            ExtensionConfig.text2vec.modelName() ?? 'Xenova/bge-base-zh-v1.5',
          device: ExtensionConfig.text2vec.device(),
        },
      },
      reranker: {
        startupBackend: rerankerConfig?.startupType,
        transformersConfig: {
          dir: workspace.dir[FolderName.reRankerDir](),
          modelName: rerankerConfig?.modelName ?? 'Xenova/bge-reranker-base',
          device: rerankerConfig?.device,
          dtype: rerankerConfig?.dtype,
        },
      },
      llm: {
        startup: ExtensionConfig['llama.startup'](),
        llamaConfig: {
          dir: workspace.dir[FolderName.llamaDir](),
          modelList: ExtensionConfig['llama.config']()?.server.list ?? [],
          modelName: modelConfig?.model,
        },
      },
      chatModelList: ExtensionConfig.chatModelList(),
    };
  }),

  setConfiguration: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    await ExtensionConfig.download.update((value) => {
      return { ...value, direct: input.download.direct };
    });
    await ExtensionConfig.vector_database.update((value) => {
      return { ...value, dir: input.qdrant.dir };
    });

    await ExtensionConfig.text2vec.update((config) => {
      return {
        ...config,
        startupType: input.embedding.startupBackend,
        modelName: input.embedding.transformersConfig.modelName,
        device: input.embedding.transformersConfig.device,
        dir: input.embedding.transformersConfig.dir,
      };
    });

    if (input.embedding.startupBackend === 'transformers') {
      await ExtensionConfig.text2vec.update((config) => {
        return {
          ...config,
          modelName: input.embedding.transformersConfig.modelName,
        };
      });
    }
    await ExtensionConfig.reranker.update((config) => {
      return {
        ...config,
        startupType: input.reranker.startupBackend,
        dir: input.reranker.transformersConfig.dir,
        modelName: input.reranker.transformersConfig.modelName,
        device: input.reranker.transformersConfig.device,
        dtype: input.reranker.transformersConfig.dtype,
      };
    });
    await ExtensionConfig['llama.startup'].set(input.llm.startup);
    if (input.llm.startup) {
      await ExtensionConfig['llama.dir'].set(input.llm.llamaConfig.dir);
      const HOST = ExtensionConfig['llama.listen']();
      ExtensionConfig.chatModelList.update((list) => {
        list = list.slice() ?? [];
        list[0] = {
          ...list[0],
          name: list[0]?.name ?? 'default',
          model: input.llm.llamaConfig.modelName,
          baseURL: `http://${HOST}/v1`,
        };
        return list;
      });
      await ExtensionConfig['llama.config'].update((config) => {
        return {
          ...config,
          server: {
            ...config.server,
            list: input.llm.llamaConfig.modelList,
          },
        };
      });
    }

    // 对话
    ExtensionConfig.chatModelList.set(input.chatModelList);
  }),
  toggleEmbedding: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const text2vecService = ctx.injector.get(Text2VecService);
    text2vecService.reSet();
  }),
  text2vec: t.router({
    download: t.procedure
      .input(v.custom<any>(Boolean))
      .subscription(({ input, ctx }) => {
        // todo 所有配置改为变更即修改,
        const service = ctx.injector.get(Text2VecService);
        const workspace = ctx.injector.get(WorkspaceService);
        return observable<InstallMessage>((ob) => {
          const index = 0;
          service
            .get({
              model: input.modelName,
              type: 'transformers',
            })
            .then((instance) =>
              (instance as TransformersEmbeddingService).download(
                workspace.dir[FolderName.text2vecDir](),
                ExtensionConfig.text2vec.modelName()!,
                (data) => {
                  // if (data.ended) {
                  //   index++;
                  // }
                  ob.next({
                    type: 'message',
                    value: index * 5,
                    message: data,
                  });
                },
              ),
            )
            .then((result) => {
              if (result) {
                ob.next({ type: 'end', value: 100 });
              } else {
                ob.next({ type: 'error', value: 0 });
              }
              ob.complete();
            });
        });
      }),
  }),
  llamaSwap: t.router({
    downloadModel: t.procedure
      .input(
        v.object({
          repo: v.optional(v.string()),
          fileName: v.optional(v.string()),
          url: v.optional(v.string()),
          token: v.optional(v.string()),
          vendor: v.optional(v.string()),
        }),
      )
      .subscription(async ({ input, ctx }) => {
        const llamaService = ctx.injector.get(LlamaSwapService);
        const result = ExtensionConfig['llama.config']();
        const globalToken = result?.server.global?.config?.common?.['hf-token'];
        const token = globalToken?.enable
          ? (globalToken.value?.[0] ?? input.token)
          : input.token;
        const channel = ctx.injector.get(LogFactoryService).getLog('llama.cpp');
        return observable<any>((ob) => {
          const progressLog = createMessage2Log();
          llamaService
            .downloadModel(
              {
                repo: input.repo,
                url: input.url,
                fileName: input.fileName,
                token: token,
              },
              {
                progressMessage: (message) => {
                  const result = progressLog(message);
                  if (result) {
                    ob.next(result);
                    channel.info(result.message);
                  }
                },
              },
            )
            .then(async (value) => {
              ob.next({
                type: 'end',
                value: value,
              });
              ob.complete();
            })
            .catch((rej) => {
              ob.error(rej);
              throw rej;
            });
        });
      }),

    checkUpdate: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
      return ctx.injector
        .get(LlamaSwapService)
        .checkVersion(ExtensionConfig['llama-swap.install'].version().slice(1));
    }),
    getLlamaVersion: t.procedure
      .input(v.any())
      .query(async ({ input, ctx }) => {
        return ExtensionConfig['llama-swap.install'].llamaVersion();
      }),
    status: t.procedure.input(v.any()).subscription(async ({ input, ctx }) => {
      const instance = ctx.injector.get(LlamaSwapService);
      return observable<{
        installStatus: InstallStatus;
        runningStatus: RunningStatus;
      }>((ob) => {
        effect(
          () => {
            const value = {
              installStatus: instance.exist$()
                ? InstallStatus.installed
                : InstallStatus.uninstalled,
              runningStatus: instance.start$()
                ? RunningStatus.running
                : RunningStatus.stopped,
            };
            ob.next(value);
          },
          { injector: ctx.injector },
        );
      });
    }),

    download: t.procedure
      .input(v.any())
      .subscription(async ({ input, ctx }) => {
        const llamaService = ctx.injector.get(LlamaSwapService);
        return observable<InstallMessage>((ob) => {
          const progressLog = createMessage2Log();
          llamaService
            .downloadExec(ExtensionConfig['llama-swap.install'].version(), {
              progressMessage: (message) => {
                const result = progressLog(message);
                if (result) {
                  ob.next(result);
                }
              },
            })
            .then(async () => {
              llamaService.startup();
            })
            .finally(() => {
              ob.complete();
            });
        });
      }),
  }),

  qdrant: t.router({
    checkUpdate: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
      return ctx.injector
        .get(QdrantServerService)
        .checkVersion(ExtensionConfig.vector_database.version());
    }),
    status: t.procedure.input(v.any()).subscription(async ({ input, ctx }) => {
      const instance = ctx.injector.get(QdrantServerService);
      return observable<{
        installStatus: InstallStatus;
        runningStatus: RunningStatus;
      }>((ob) => {
        effect(
          () => {
            const value = {
              installStatus: instance.exist$()
                ? InstallStatus.installed
                : InstallStatus.uninstalled,
              runningStatus: instance.start$()
                ? RunningStatus.running
                : RunningStatus.stopped,
            };
            ob.next(value);
          },
          { injector: ctx.injector },
        );
      });
    }),
    download: t.procedure
      .input(v.any())
      .subscription(async ({ input, ctx }) => {
        const qdrantService = ctx.injector.get(QdrantServerService);
        return observable<{ value?: number; type?: string }>((ob) => {
          const progressLog = createMessage2Log();
          qdrantService
            .downloadExec({
              progressMessage: (message) => {
                const result = progressLog(message);
                if (result) {
                  ob.next(result);
                }
              },
            })
            .then(async () => {
              await qdrantService.init();
            })
            .finally(() => {
              ob.complete();
            });
        });
      }),
  }),
  ocr: t.router({
    status: t.procedure.input(v.any()).subscription(async ({ input, ctx }) => {
      const service = ctx.injector.get(OCRService);
      return observable<{
        installStatus: InstallStatus;
      }>((ob) => {
        effect(
          () => {
            const value = {
              installStatus: service.installStatus$(),
            };
            ob.next(value);
          },
          { injector: ctx.injector },
        );
      });
    }),
    download: t.procedure
      .input(v.string())
      .subscription(async ({ input, ctx }) => {
        const instance = ctx.injector.get(OCRService);
        return observable<{ value: number; message: string; type: string }>(
          (ob) => {
            instance
              .downloadModel(undefined, (value) => {
                ob.next({
                  type: 'message',
                  value: 0,
                  message: value,
                });
              })
              .catch((rej) => {
                ob.error(rej);
              })
              .finally(() => {
                ob.complete();
              });
          },
        );
      }),
    getConfig: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
      const workspace = ctx.injector.get(WorkspaceService);
      return {
        ocr: { dir: workspace.dir[FolderName.ocrDir]() },
      };
    }),
    saveConfig: t.procedure
      .input(v.custom<{ ocr: { dir: string } }>(Boolean))
      .query(({ input, ctx }) => {
        ExtensionConfig['ocr.dir'].set(input.ocr.dir);
      }),
  }),

  chat: t.router({
    //对话应该是直接测试就ok了不需要太多
    test: t.procedure.input(v.any()).subscription(async ({ input, ctx }) => {
      const service = ctx.injector.get(ChatService);

      const result = await (
        await service.chat()
      ).stream({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `/no_think 根据上下文对提出的问题返回答案及相关信息\n上下文:本软件是AI加持的文本编辑器,支持脑图,对话,知识库,工作流,补全,ocr,tts等功能,名叫生花笔,官方论坛 https://bbs.shenghuabi.site \n问题:请问这是什么软件?`,
              },
            ],
          },
        ],
      });
      return observable<string>((ob) => {
        (async () => {
          for await (const item of result) {
            ob.next(item.content);
          }
          ob.complete();
        })();
      });
    }),
  }),
  showChannel: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
    const channel = ctx.injector.get(ChannelService);
    channel.show(input);
  }),
  pythonAddon: t.router({
    checkUpdate: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
      const service = ctx.injector.get(TTSSerivce);
      // todo 这里的版本是固定的.因为是自己实现的
      return service.checkVersion('1.2.0');
    }),
    status: t.procedure.input(v.any()).subscription(async ({ input, ctx }) => {
      const service = ctx.injector.get(TTSSerivce);
      return observable<{
        runningStatus: number;
      }>((ob) => {
        service.start$.subscribe((start) => {
          ob.next({
            runningStatus: start,
          });
        });
      });
    }),
    download: t.procedure
      .input(v.object({ update: v.boolean() }))
      .subscription(async ({ input, ctx }) => {
        const instance = ctx.injector.get(TTSSerivce);
        return observable<{ type: string; value: number; message: string }>(
          (ob) => {
            const progressLog = createMessage2Log();
            instance
              .downloadPkg({
                progressMessage: (message) => {
                  const result = progressLog(message);
                  if (result) {
                    ob.next(result);
                  }
                },
              })
              .finally(() => {
                ob.complete();
              });
          },
        );
      }),
    downloadIndexTTSModel: t.procedure
      .input(v.string())
      .subscription(async ({ input, ctx }) => {
        const instance = ctx.injector.get(TTSSerivce);
        return observable<{ type: string; value: number; message: string }>(
          (ob) => {
            const progressLog = createMessage2Log();
            instance
              .downloadModel(input as any, {
                progressMessage: (message) => {
                  const result = progressLog(message);
                  if (result) {
                    ob.next(result);
                  }
                },
              })
              .catch(ob.error)
              .finally(ob.complete);
          },
        );
      }),
    getConfig: t.procedure.input(v.any()).query(({ ctx }) => {
      const workspace = ctx.injector.get(WorkspaceService);
      const config = {
        ...ExtensionConfig.pythonAddon(),
        dir: workspace.dir[FolderName.pythonAddon](),
      };
      return config || {};
    }),
    setConfig: t.procedure.input(v.any()).query(({ ctx, input }) => {
      ExtensionConfig.pythonAddon.update((data) => {
        return {
          ...data,
          ...input,
        };
      });
    }),
    set: t.procedure.input(v.any()).query(({ ctx, input }) => {
      const instance = ctx.injector.get(ConfigManagerService);
      instance.setRef(input.record, input.config);
    }),
    remove: t.procedure.input(v.string()).query(({ ctx, input }) => {
      const instance = ctx.injector.get(ConfigManagerService);
      instance.removeRef(input);
    }),
    getPlayerConfig: t.procedure.input(v.any()).query(({ ctx, input }) => {
      const instance = ctx.injector.get(ConfigManagerService);
      return instance.getConfig();
    }),
    getPlayerIdList: t.procedure.input(v.any()).query(({ ctx, input }) => {
      const instance = ctx.injector.get(ConfigManagerService);
      return instance.getConfig().then((list) => {
        return list.references.map((item) => {
          return {
            value: {
              player: item.player,
              state: item.state,
              language: item.language,
            },
            label: `${item.player}-${item.state}-${(LanguageMap as any)[item.language]}`,
          };
        });
      });
    }),
    getEmoPlayerIdList: t.procedure.input(v.any()).query(({ ctx, input }) => {
      const instance = ctx.injector.get(ConfigManagerService);
      return instance.getConfig().then((list) => {
        return list.indexTTSEmoReferences.map((item) => {
          return {
            value: {
              player: item.player,
              state: item.state,
              language: item.language,
            },
            label: `${item.player}-${item.state}-${(LanguageMap as any)[item.language!]}`,
          };
        });
      });
    }),
    getTTSBackend: t.procedure.input(v.any()).query(({ ctx, input }) => {
      return ExtensionConfig.tts.backend();
    }),

    setDefaultLanguage: t.procedure
      .input(v.object({ language: v.string(), player: v.string() }))
      .query(({ ctx, input }) => {
        const instance = ctx.injector.get(ConfigManagerService);
        instance.setRefDefaultLanguage(input.language, input.player);
      }),
    setPlayerState: t.procedure.input(v.any()).query(({ ctx, input }) => {
      const instance = ctx.injector.get(ConfigManagerService);
      instance.setRefDefaultPlayerState(input.player, input.state);
    }),
    getSelectedAudioItem: t.procedure
      .input(v.any())
      .subscription(async ({ input, ctx }) => {
        return observable<any>((ob) => {
          (ctx as any)['registrySelect']((value: any) => {
            ob.next(value);
          });
          return () => {
            (ctx as any)['editorDispose']();
          };
        });
      }),
    changeQueue: t.procedure
      .input(v.object({ mode: v.string(), value: v.any() }))
      .query(({ ctx, input }) => {
        return (ctx as any)['changeQueue'](input);
      }),
    textToAuduio: t.procedure.input(v.any()).query(({ ctx, input }) => {
      return (ctx as any)['textToAuduio'](input);
    }),
  }),
  getAssetPath: t.procedure.input(v.string()).query(({ ctx, input }) => {
    return ctx.webview.asWebviewUri(vscode.Uri.file(input)).toString();
  }),
  tts: t.router({
    getConfig: t.procedure.input(v.any()).query(({ ctx }) => {
      const workspace = ctx.injector.get(WorkspaceService);
      return {
        common: ExtensionConfig.tts() ?? {},
        indextts: ExtensionConfig.indexTTS() ?? {},
      };
    }),
    setConfig: t.procedure.input(v.any()).query(({ ctx, input }) => {
      ExtensionConfig.tts.update((data) => {
        return {
          ...data,
          ...input.common,
        };
      });
      ExtensionConfig.indexTTS.update((data) => {
        return {
          ...data,
          ...input.indextts,
        };
      });
    }),
    getChangeAudioItemList: t.procedure
      .input(v.any())
      .query(({ ctx, input }) => {
        return ctx.injector.get(TTSPluginSerivce).getChangeAudioItemList();
      }),
    getBeforeConcatList: t.procedure.input(v.any()).query(({ ctx, input }) => {
      return ctx.injector.get(TTSPluginSerivce).getBeforeConcatList();
    }),
    getAfterConcatList: t.procedure.input(v.any()).query(({ ctx, input }) => {
      return ctx.injector.get(TTSPluginSerivce).getAfterConcatList();
    }),
  }),
  reranker: t.router({
    transfomers: t.router({
      downloadModel: t.procedure.input(v.any()).subscription(async function* ({
        input,
        ctx,
      }) {
        const instance = ctx.injector
          .get(ReRankerService)
          .get(ExtensionConfig.reranker() as any);
        yield {
          type: 'message',
          value: 0,
          message: '下载开始',
        };
        const aga = createAsyncGeneratorAdapter<{
          type: string;
          value: number;
          message: string;
        }>();
        instance
          .download((data) => {
            aga.next({ type: 'message', value: 0, message: data });
          })
          .finally(() => {
            aga.complete();
          });

        yield* aga.getData();
      }),
    }),
  }),
});
