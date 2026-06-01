import { CARD_NODE_DEFINE } from '../card.node.define';
import { NODE_COMMON } from '../common';
import { CardRunner } from './card.runner';

export const CardMainConfig = {
  ...NODE_COMMON,
  runner: CardRunner,
  configDefine: CARD_NODE_DEFINE,
} as const;
