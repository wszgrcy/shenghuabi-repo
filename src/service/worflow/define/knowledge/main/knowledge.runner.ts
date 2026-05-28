import { inject } from 'static-injector';
import { serializeLexicalTextarea } from '@shenghuabi/workflow';
import { NodeRunnerBase } from '@shenghuabi/workflow';

import { KNOWLEDGE_NODE_DEFINE } from '../knowledge.node.define';
import { DocumentVectorServiceToken } from '../../../../../token';

export class KnowledgeRunner extends NodeRunnerBase<
  typeof KNOWLEDGE_NODE_DEFINE
> {
  #docVector = inject(DocumentVectorServiceToken);
  override async run() {
    const config = this.inputs;

    const question = serializeLexicalTextarea(config.question, {
      context: await this.nodeContextData$$(),
      environmentContext: this.environmentContextData,
    });
    const knowledgeName = config.value;
    const result = await this.#docVector.queryKnowledge(
      knowledgeName,
      question,
      config.limit,
    );

    return async () => {
      return result;
    };
  }
}
