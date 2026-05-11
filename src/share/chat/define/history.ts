import {
  AssistantChatMessage,
  ChatMessageListOutputType,
  UserChatCompletionContent,
} from '@shenghuabi/openai/define';
import * as v from 'valibot';
/** 每一步进行一次保存?感觉不需要保存这么多,可以优化 */
/** 多轮对话保存 */
export const ChatHistoryList = v.array(
  v.object({
    input: UserChatCompletionContent,
    historyList: v.optional(v.custom<ChatMessageListOutputType>(Boolean)),
    /** 最终对话返回的内容 */
    result: v.optional(AssistantChatMessage),
  }),
);

export type ChatHistoryListType = v.InferOutput<typeof ChatHistoryList>;
