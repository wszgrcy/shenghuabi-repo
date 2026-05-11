import { ChatMessageListOutputType } from '@bridge/share';
import { UserChatCompletionContentType } from '@shenghuabi/openai/define';
export type CommonChatFn = (
  input: UserChatCompletionContentType,
  list: ChatMessageListOutputType,
  nextIndex: number,
) => void;
