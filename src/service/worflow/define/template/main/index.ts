import { NODE_COMMON } from '../common';
import { TEMPLATE_NODE_DEFINE } from '../template.node.define';
import { TemplateRunner } from './template.runner';

export const TemplateMainConfig = {
  ...NODE_COMMON,
  runner: TemplateRunner,
  define: TEMPLATE_NODE_DEFINE,
} as const;
