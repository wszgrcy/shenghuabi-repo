import { inject } from 'static-injector';
import { TemplateFormatService } from '@shenghuabi/workflow';
import { NodeRunnerBase } from '@shenghuabi/workflow';
import { DocumentVectorService } from '../../../../vector-query/document-vector.service';

import { htmlToText } from 'html-to-text';

import { ChatContextType } from '../../../../../share';
import { WorkflowExtraMetadata } from '@shenghuabi/workflow';
import { KNOWLEDGE_NODE_DEFINE } from '../knowledge.node.define';
import * as v from 'valibot';
import {
  FileChunkPayload,
  FileChunkPayloadDefine,
} from '@shenghuabi/knowledge/knowledge';

export class KnowledgeRunner extends NodeRunnerBase<
  typeof KNOWLEDGE_NODE_DEFINE
> {
  #format = inject(TemplateFormatService);
  #docVector = inject(DocumentVectorService);
  override async run() {
    const obj = this.inputValueObject$$();
    const nodeResult = this.getParsedNode(KNOWLEDGE_NODE_DEFINE);

    const config = nodeResult.data.config;
    let question = config.question as string;
    question = this.#format.interpolate(question, obj);
    const pathList = this.node.data.value as string[];
    let result: (FileChunkPayload & { word: string; knowledge: string })[];
    // todo 可以指定知识库查询限制或者允许配置
    if (config.source === 'article') {
      result = (await this.#docVector.querySimilar(
        question,
        pathList,
        config.limit ?? 5,
      )) as any;
    } else {
      result = (await this.#docVector.queryKnowledge(
        pathList[0],
        question,
        config.limit ?? 5,
      )) as any;
      if (config.source !== 'dict') {
        result = result.map((item) => ({
          ...v.parse(FileChunkPayloadDefine, item),
          knowledge: pathList[0],
        })) as any;
      } else {
        result.forEach((item) => {
          item.knowledge = pathList[0];
        });
      }
    }
    return async () => {
      const formatContent = (item: any) => {
        if (config.source === 'dict') {
          // todo 最好统一关于连接的处理
          item.content = htmlToText(item.content).trim();
        }
        if (config.template?.enable && config.template?.value) {
          return this.#format.interpolate(config.template.value, {
            ENTRY: item,
          });
        } else if (config.source === 'dict') {
          return item.content;
        } else {
          return item.chunk;
        }
      };

      return result.map((item) => formatContent(item));
    };
  }
}
