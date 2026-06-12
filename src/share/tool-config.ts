import { SingleNodeConfig } from '@shenghuabi/workflow';
import * as v from 'valibot';
import { KnowledgeMainConfig } from '../service/worflow/define/knowledge/main';
import { RagMainConfig } from '../service/worflow/define/rag/main';
// import { ReadMindMainConfig } from '../service/worflow/define/read-mind/main';
import { ReadDocumentMainConfig } from '../service/worflow/define/read-document/main';
import { ReplaceSelectStringMainConfig } from '../service/worflow/define/replace-select-string/main';

export const TOOL_CONFIG_LIST: SingleNodeConfig<v.BaseSchema<any, any, any>>[] =
  [
    // ChatMainConfig,
    // CategoryMainConfig,
    // NodeMainObj.TextMainConfig,
    // ArticleMainConfig,
    // ChatVlMainConfig,
    KnowledgeMainConfig,
    RagMainConfig,
    // ReadMindMainConfig,
    ReadDocumentMainConfig,
    ReplaceSelectStringMainConfig,
  ];
