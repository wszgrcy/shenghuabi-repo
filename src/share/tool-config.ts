import { SingleNodeConfig } from '@shenghuabi/workflow';
import * as v from 'valibot';
import { KnowledgeMainConfig } from '../service/worflow/define/knowledge/main';
import { RagMainConfig } from '../service/worflow/define/rag/main';

export const TOOL_CONFIG_LIST: SingleNodeConfig<v.BaseSchema<any, any, any>>[] =
  [
    // ChatMainConfig,
    // CategoryMainConfig,
    // NodeMainObj.TextMainConfig,
    // ArticleMainConfig,
    // ChatVlMainConfig,
    KnowledgeMainConfig,
    RagMainConfig,
  ];
