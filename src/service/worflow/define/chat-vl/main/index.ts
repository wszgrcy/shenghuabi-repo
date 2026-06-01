import { NODE_COMMON } from '../common';
import { CHAT_VL_NODE_DEFINE } from '../chat.node.define';
import { ChatVlRunner } from './runner';

export const ChatVlMainConfig = {
  ...NODE_COMMON,
  runner: ChatVlRunner,
  configDefine: CHAT_VL_NODE_DEFINE,
} as const;
