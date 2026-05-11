import { Injectable, inject } from '@angular/core';
import {
  ChatMessageListInputType,
  ResolvedWorkflow,
  UUID_NS,
  WorkflowChatOptions,
  WorkflowData,
} from '@bridge/share';
import { TrpcService } from '@fe/trpc';
import { ChatTemplateService } from '../../service/chat-template.service';
import { v5 } from 'uuid';

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
  #chatTemplate = inject(ChatTemplateService);
  // todo llm是独立算的,这里使用的是上下文,不需要节点持久,所以可以一起
  async resolveInputs(template?: ChatMessageListInputType) {
    if (!template || !template.length) {
      return [];
    }
    return this.#chatTemplate
      .parseTemplate(
        template.flatMap((item) =>
          item.content.map((item) => (item.type === 'text' ? item.text : '')),
        ),
      )()
      .then((result) => {
        if (!result) {
          return;
        }
        return result.concat(
          template
            .flatMap((item) =>
              item.content.map((item) =>
                item.type === 'image_url' ? item.image_url.url : '',
              ),
            )
            .filter(Boolean)
            .map((item) => {
              return {
                inputType: 'image',
                value: item!,
                id: v5(item!, UUID_NS),
                label: item!,
              };
            }),
        );
      });
  }

  async getWorkflowWithDefine(
    workflow: NonNullable<WorkflowChatOptions['workflow']>,
  ): Promise<WorkflowData & { define: ResolvedWorkflow }> {
    return this.#client.workflow.getWithDefine.query(workflow!) as any;
  }
  /** mind 中被重写了 */
  mergeInputParams(obj: any) {
    return obj;
  }
}
