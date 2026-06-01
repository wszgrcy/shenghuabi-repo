import { inject } from 'static-injector';

import { NodeRunnerBase, serializeLexicalTextarea } from '@shenghuabi/workflow';

import { AbortSignalToken } from '@shenghuabi/workflow';
import { RAG_NODE_DEFINE } from '../rag.node.define';
import {
  CustomKnowledgeManagerServiceToken,
  dynamicInject,
  Rag2ClassToken,
} from '../../../../../token';

export class RagRunner extends NodeRunnerBase<typeof RAG_NODE_DEFINE> {
  #abort = inject(AbortSignalToken);
  #rag2 = inject(Rag2ClassToken);
  #manager$$ = dynamicInject(CustomKnowledgeManagerServiceToken);
  override async run() {
    const config = this.inputs;
    const searchContent = serializeLexicalTextarea(this.inputs.searchContent, {
      context: await this.nodeContextData$$(),
      environmentContext: this.environmentContextData,
    });
    if (!this.#manager$$().hasGraph(config.name)) {
      throw new Error(`未找到匹配知识库: ${config.name}`);
    }
    // 相当于转发执行了
    const result = await this.#rag2.query(
      searchContent,
      { ...config },
      this.emitter,
      this.#abort,
    );

    return async (id: string) => {
      return {
        value: result?.response,
      };
    };
  }
}
