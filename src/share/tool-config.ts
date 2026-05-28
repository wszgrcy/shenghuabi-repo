import { SingleNodeConfig } from '@shenghuabi/workflow';
import * as v from 'valibot';
import { NodeMainObj } from '@shenghuabi/workflow';
import { KnowledgeMainConfig } from '../service/worflow/define/knowledge/main';

export const TOOL_CONFIG_LIST: SingleNodeConfig<v.BaseSchema<any, any, any>>[] =
  [
    // ChatMainConfig,
    // CategoryMainConfig,
    NodeMainObj.TextMainConfig,
    // ArticleMainConfig,
    // ChatVlMainConfig,
    KnowledgeMainConfig,
  ];
