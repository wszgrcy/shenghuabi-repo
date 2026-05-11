import * as v from 'valibot';
import { t } from './t';

import { observable } from '@trpc/server/observable';
import {
  CHAT_ITEM_TYPE,
  PromptTemplateChatOption,
  RawWorkflowNode,
} from '../share';
import { AiChatProvider } from '../webview/custom-sidebar/ai-chat.service';
import { PromptInput } from '../service/ai/prompt.type';
import { ChatService } from '../service/ai/chat.service';
import { ChatMessageListOutputType } from '@shenghuabi/openai/define';
import type { WorkflowStreamData } from '@shenghuabi/workflow/share';
import { WorkflowExecService } from '@shenghuabi/workflow';
/**
 * 默认就是key
 * query=>通过value进行查询，查询有可能用到其他上下文，查询返回值为key
 * insert=>直接为key(是文章就读，是其他的就直接用)
 * 任何情况下insert只有一个。或者多个都会插入进去。由上游控制每个对话
 */
export const AiRouter = t.router({
  // 目前好像仅用于卡片内部对话
  codeAction: t.procedure
    .input(v.any())
    .subscription(async ({ input, ctx }) => {
      const provider = ctx.injector.get(AiChatProvider);
      const data = provider.codeActionData$;

      return observable<PromptTemplateChatOption>((emit) => {
        data.subscribe((value) => {
          if (!value) {
            return;
          }
          emit.next(value.option);
        });
      });
    }),

  agentChat: t.procedure
    .input(
      v.object({
        template: v.optional(v.custom<ChatMessageListOutputType>(Boolean), []),
        input: v.optional(v.custom<PromptInput>(Boolean), {}),
        context: v.optional(
          v.custom<Record<string, RawWorkflowNode>>(Boolean),
          {},
        ),
        modelConfigName: v.optional(v.string()),
      }),
    )
    .subscription(async ({ input, ctx }) => {
      const chatService = ctx.injector.get(ChatService);
      const exec = ctx.injector.get(WorkflowExecService);
      const abort = new AbortController();
      return observable<WorkflowStreamData>((emit) => {
        (async () => {
          await exec.agentChat(
            {
              ...input,
              inlineMode: false,
              modelOptions: chatService.getModelConfig(input.modelConfigName),
            },
            (chatResult) => {
              emit.next(chatResult);
            },
            abort.signal,
          );
          emit.complete();
        })();
        return () => {
          abort.abort();
        };
      });
    }),
  /** 普通对话 */
  chat: t.procedure
    .input(
      v.object({
        input: v.custom<CHAT_ITEM_TYPE>(Boolean),
        historyList: v.custom<ChatMessageListOutputType>(Boolean),
        modelConfigName: v.optional(v.string()),
      }),
    )
    .subscription(async ({ input, ctx }) => {
      const abort = new AbortController();
      const chatService = ctx.injector.get(ChatService);
      // 返回历史列表
      return observable<ChatMessageListOutputType>((ob) => {
        (async () => {
          const llm = await chatService.chat(
            chatService.getModelConfig(input.modelConfigName),
          );
          const historyList: ChatMessageListOutputType = [
            ...input.historyList,
            { role: 'user', content: input.input },
          ];
          const result = llm.stream(
            {
              messages: historyList,
            },
            { signal: abort.signal },
          );
          try {
            for await (const item of result) {
              ob.next([
                ...historyList,
                {
                  role: 'assistant',
                  content: [
                    {
                      type: 'text',
                      text: item.content,
                    },
                  ],
                  thinkContent: item.thinkContent,
                },
              ] as ChatMessageListOutputType);
            }
          } catch (error) {
            ob.error(error);
          }
          ob.complete();
        })();

        return () => {
          abort.abort();
        };
      });
    }),
  /** 修复相关操作应用 */
  applyCodeAction: t.procedure
    .input(v.string())
    .query(async ({ input, ctx }) => {
      const chatService = ctx.injector.get(AiChatProvider);
      chatService.codeActionData$.value?.documentChange(input);
    }),
});
