import { inject, Injectable, signal } from '@angular/core';
import { UUID_NS, WorkflowNodeConfigObj } from '@bridge/share';
import { PiResolvedViewFieldConfig } from '@piying/view-angular';
import { KeyPath } from '@piying/view-angular-core';
import { v5 } from 'uuid';
import { ChatTemplateService } from '../../service/chat-template.service';
import { ChatService } from '@fe/component/chat/chat.service';
import { TrpcService } from '@fe/trpc';
import type { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { deepEqual } from 'fast-equals';
import { IterationNodeDefine } from '../../page/workflow/custom-node/iteration-node';
import { IterationStartNodeDefine } from '../../page/workflow/custom-node/iteration-start-node';
import { InputParamsNodeDefine } from '../../page/workflow/custom-node/params-node';
import { WebviewNodeMap } from '@shenghuabi/workflow/webview';
@Injectable()
export class ChatNodeService {
  #chatTemplate = inject(ChatTemplateService);
  #chat = inject(ChatService);
  #client = inject(TrpcService).client;
  pluginNodeList$ = signal<WebviewNodeConfig[]>([], { equal: deepEqual });
  nodeList$ = signal<WebviewNodeConfig[]>(
    [
      ...Object.values(WebviewNodeMap),
      ...Object.values(WorkflowNodeConfigObj),
      InputParamsNodeDefine,
      IterationStartNodeDefine,
      IterationNodeDefine,
    ].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)),
  );

  context = {
    getModelList: () =>
      this.#client.chat.getChatModelConfigNameOptions.query(undefined),
    getContextTree: (type: string) => this.#chat.getContextTree(type),
    changeHandleData: (
      field: PiResolvedViewFieldConfig,
      type: 'input' | 'output',
      index: number,
      value: any[],
    ) => {
      const result = field.get(['#', 'data', 'handle', type])!;
      result.action.set(
        value.map((item) => {
          return { ...item, id: v5(item.value, UUID_NS) };
        }),
        index,
      );
    },
    changeNodeData: (
      field: PiResolvedViewFieldConfig,
      keyPath: KeyPath,
      value: any,
    ) => {
      const result = field.get(keyPath);
      result?.form.control?.updateValue(value);
    },
    parseTemplate: (
      value: string,
      language?: 'js' | 'plaintext' | 'liquid',
    ) => {
      return this.#chatTemplate.parseTemplate(value, language)();
    },
    getActionList: (
      value: string,
      language?: 'js' | 'plaintext' | 'liquid',
    ) => {
      return this.#client.environment.pythonAddon.getPlayerIdList.query(
        undefined,
      );
    },
    changeHandleByTemplate: (
      field: any,
      value: string,
      index: number,
      excludes?: any[],
    ) => {
      return this.#chatTemplate
        .parseTemplate(value)()
        .then((result) => {
          if (!result) {
            return;
          }
          if (excludes) {
            result = result.filter((item) => !excludes.includes(item.value));
          }
          return this.context.changeHandleData(field, 'input', index, result);
        });
    },
    selectRagKnowledgeList: () => {
      return this.#client.workflow.selectRagKnowledgeList
        .query(undefined)
        .then((list) => {
          return list.map((item) => ({
            label: item.name,
            value: item.name,
          }));
        });
    },
    selectGraphNode: (str: string, graphName: string) => {
      return this.#client.workflow.selectGraphNode.query({
        search: str,
        graphName: graphName,
        selectedList: [],
      });
    },

    selectWorkflow: () => {
      return this.#client.workflow.selectWorkflow.query(undefined);
    },
    getWorkflowInputList: (fileName: string) => {
      return this.#client.workflow.getWorkflowInputList.query(fileName);
    },
    openTsEditor: (form: any, field: PiResolvedViewFieldConfig) => {
      return new Promise((resolve) => {
        this.#client.workflow.openTsEditor.subscribe(
          {
            content: form.data.value ?? '',
            title: form.data.title!,
            input: (form.data as any).input,
            output: (form.data as any).output,
          },
          {
            onData: (data) => {
              field.form.control!.updateValue(data);
            },
            onComplete: () => {
              resolve(undefined);
            },
            onError: () => {
              resolve(undefined);
            },
          },
        );
      });
    },
    pluginMethod: (method: string, args: any[]) => {
      return this.#client.workflow.pluginMethod.query({ method, args });
    },
  };
}
