import { observable } from '@trpc/server/observable';
import { AiChatProvider } from '../webview/custom-sidebar/ai-chat.service';
import { t } from './t';
import * as v from 'valibot';
import { ChatService } from '../service/ai/chat.service';
import { ActionConfig, PromptService } from '../service/ai/prompt.service';
import { ChatMindNode, DEFAULT_INPUT_KEY, PromptItem } from '../share';
import { PromptTree } from '../webview/custom-sidebar/prompt.tree';
import { WatchService } from '../service/fs/watch.service';
import { firstValueFrom } from 'rxjs';
import * as vscode from 'vscode';
import { COMMAND } from '@global';
import { ExtensionConfig } from '../service/config.service';
export const ChatRouter = t.router({
  reset: t.procedure.input(v.any()).subscription(async ({ input, ctx }) => {
    const provider = ctx.injector.get(AiChatProvider);

    return observable((emit) => {
      provider.reset$.subscribe((value) => {
        if (value) {
          emit.next(true);
        }
      });
    });
  }),
  dataChange: t.procedure
    .input(v.any())
    .subscription(async ({ input, ctx }) => {
      const chatService = ctx.injector.get(ChatService);
      return observable<typeof chatService.changePrompt$.value>((emit) => {
        const ref = chatService.changePrompt$.subscribe((value) => {
          if (value) {
            emit.next(value);
          }
        });
        return () => {
          ref.unsubscribe();
        };
      });
    }),

  savePromptTemplate: t.procedure
    .input(v.custom<PromptItem>(Boolean))
    .query(async ({ input, ctx }) => {
      const chatService = ctx.injector.get(ChatService);
      const data = chatService.changePrompt$.value;
      const result = await ctx.injector
        .get(PromptTree)
        .saveItem(data?.from || 'commonChat', input, chatService.changedIndex);
      chatService.changedIndex = result;
    }),
  savePromptTemplateByMind: t.procedure
    .input(v.custom<PromptItem & { type: string }>(Boolean))
    .query(async ({ input, ctx }) => {
      await ctx.injector.get(PromptTree).saveItemByTitle(input.type, input);
    }),

  getChatByKey: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
    const service = ctx.injector.get(WatchService);
    const pathList = input.split('/');
    return firstValueFrom(service.fileObject$).then((list) => {
      const parent = list.find((item) => item.filePath === pathList[0]);
      return parent?.children.find((child) => {
        return child.id === pathList[1];
      });
    });
  }),
  getAllChatConfig: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const service = ctx.injector.get(WatchService);
    return firstValueFrom(service.fileObject$).then((list) => {
      return list.map((parent) => {
        return {
          key: parent.filePath,
          title: parent.filePath,
          selectable: false,
          children: parent.children
            .filter((item) => item.type === 'chat' && item.data?.title)
            .map((item) => {
              return {
                key: parent.filePath + '/' + item.id,
                title: (item as ChatMindNode).data.title,
              };
            }),
        };
      });
    });
  }),
  /** 保存的模板，目前只支持通用对话，其他的不支持，毕竟action那里是不需要的 */
  getPromptList: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const list = await ctx.injector.get(PromptService).chatConfig.getList();
    return [
      {
        key: 'commonChat',
        title: '通用对话',
        children: list?.map((item) => {
          return { key: `commonChat/${item.title}`, title: item.title };
        }),
      },
    ];
  }),
  getPromptByKey: t.procedure
    .input(v.string())
    .query(async ({ input, ctx }) => {
      const pathList = input.split('/');
      let list;
      if (pathList[0] === 'codeAction') {
        list = await ctx.injector.get(PromptService).actionConfig.getList();
      } else if (pathList[0] === 'commonChat') {
        list = await ctx.injector.get(PromptService).chatConfig.getList();
      }
      return list?.find((item) => item.title === pathList[1]);
    }),
  loadPromptList: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const list = await ctx.injector.get(PromptService).chatConfig.getList();
    const list2 = await ctx.injector.get(PromptService).actionConfig.getList();
    return [
      {
        label: '选中处理',
        group: true,
        children: list2?.map((item) => {
          return {
            label: item.title,
            data: {
              click: `codeAction/${item.title}`,
            },
          };
        }),
      },
      {
        label: '通用对话',
        group: true,
        children: list?.map((item) => {
          return {
            label: item.title,
            data: {
              click: `commonChat/${item.title}`,
            },
          };
        }),
      },
    ];
  }),

  getSelectionList: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const list2 = await ctx.injector.get(PromptService).actionConfig.getList();
    return list2;
  }),
  selectionChange: t.procedure
    .input(v.custom<{ config: ActionConfig; selection: string }>(Boolean))
    .subscription(async ({ input, ctx }) => {
      return observable<string>((emit) => {
        vscode.commands.executeCommand(
          COMMAND['call-ai-chat-sidebar'],
          {
            ...input.config,
            input: {
              [DEFAULT_INPUT_KEY]: {
                selection: input.selection,
              },
            },
          },
          (value: string) => {
            emit.next(value);
          },
        );
      });
    }),

  getChatModelConfigName: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      const list = ExtensionConfig.chatModelList();
      if (!list) {
        return;
      }
      const result = await vscode.window.showQuickPick(
        list.map((item) => ({ label: item.name, value: item.name })),
      );

      return result?.value;
    }),
  getChatModelConfigNameOptions: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      const list = ExtensionConfig.chatModelList();
      return (list ?? []).map((item) => ({
        label: item.name,
        value: item.name,
      }));
    }),
});
