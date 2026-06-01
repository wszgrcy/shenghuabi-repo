import { SingleNodeConfig } from '@shenghuabi/workflow';
import * as v from 'valibot';
import { KnowledgeMainConfig } from '../../src/service/worflow/define/knowledge/main';

import { NodeMainObj } from '@shenghuabi/workflow';

export const TOOL_CONFIG_LIST: SingleNodeConfig<v.BaseSchema<any, any, any>>[] =
  [
    // ChatMainConfig,
    // CategoryMainConfig,
    NodeMainObj.TextMainConfig,
    // ArticleMainConfig,
    //   ChatVlMainConfig,
    KnowledgeMainConfig,
  ];
