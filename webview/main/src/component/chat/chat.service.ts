import { Injectable, inject } from '@angular/core';
import {
  ChatMessageListInputType,
  ResolvedWorkflow,
  WorkflowChatOptions,
  WorkflowData,
} from '@bridge/share';
import { TrpcService } from '@fe/trpc';
import { ResolvedWorkflowResult } from '@shenghuabi/workflow';

@Injectable()
export class ChatService {
  #client = inject(TrpcService).client;
  display = {
    title: true,
    tooltip: true,
  };

  async getContextTree(type: string): Promise<{
    data: { key: any; title: string; children?: any[] }[];
    multi: boolean;
  }> {
    if (type === 'article') {
      return { data: await this.#getArticleData(), multi: true };
    } else {
      return {
        data: await this.#client.knowledge.findAll
          .query({ type: type })
          .then((list) => {
            return list.map((item) => {
              return {
                title: item.name,
                key: item.name,
              };
            });
          }),
        multi: false,
      };
    }
    throw new Error(`未知类型：${type}`);
  }
  #getArticleData() {
    return this.#client.fs.findAll.query({ flat: false });
  }

  // todo llm是独立算的,这里使用的是上下文,不需要节点持久,所以可以一起
  // todo 已经修改
  async resolveInputs(template?: ChatMessageListInputType) {
    if (!template || !template.length) {
      return [];
    }
    return [];
  }

  async getWorkflowWithDefine(
    workflow: NonNullable<WorkflowChatOptions['workflow']>,
  ): Promise<
    WorkflowData & {
      define: ResolvedWorkflow;
      resolved: ResolvedWorkflowResult;
    }
  > {
    return this.#client.workflow.getWithDefine.query(workflow!) as any;
  }
  /** mind 中被重写了 */
  mergeInputParams(obj: any) {
    return obj;
  }
}
