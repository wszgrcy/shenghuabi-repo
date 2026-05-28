import { computed, inject, Injectable, signal } from '@angular/core';
import { WorkflowNodeConfigObj } from '@bridge/share';
import { PiResolvedViewFieldConfig } from '@piying/view-angular';
import { KeyPath } from '@piying/view-angular-core';
import { ChatTemplateService } from '../../service/chat-template.service';
import { ChatService } from '@fe/component/chat/chat.service';
import { TrpcService } from '@fe/trpc';
import type { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { deepEqual } from 'fast-equals';
import { IterationNodeDefine } from '../../page/workflow/custom-node/iteration-node';
import { IterationStartNodeDefine } from '../../page/workflow/custom-node/iteration-start-node';
import { WebviewNodeMap } from '@shenghuabi/workflow/webview';

const EntryObj = {
  'workflow-parser': [
    { label: '切片', name: 'chunk', id: 'chunk' },
    { label: '文件名', name: 'fileName', id: 'fileName' },
    { label: '实体类型列表', name: 'entityTypeList', id: 'entityTypeList' },
  ],
};
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
      IterationStartNodeDefine,
      IterationNodeDefine,
    ].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)),
  );

  #nodeObject$$ = computed(() => {
    return this.nodeList$().reduce(
      (obj, item) => {
        obj[item.type] = item;
        return obj;
      },
      {} as Record<string, WebviewNodeConfig>,
    );
  });
  #pluginNodeObject$$ = computed(() => {
    return this.pluginNodeList$().reduce(
      (obj, item) => {
        obj[item.type] = item;
        return obj;
      },
      {} as Record<string, WebviewNodeConfig>,
    );
  });
  readonly fullNodeObject$$ = computed(() => {
    return { ...this.#nodeObject$$(), ...this.#pluginNodeObject$$() };
  });
  context = {
    getModelList: () =>
      this.#client.chat.getChatModelConfigNameOptions.query(undefined),
    getContextTree: (type: string) => this.#chat.getContextTree(type),

    changeNodeData: (
      field: PiResolvedViewFieldConfig,
      keyPath: KeyPath,
      value: any,
    ) => {
      const result = field.get(keyPath);
      result?.form.control?.updateValue(value);
    },
    parseTemplate: (value: string, language?: 'js' | 'plaintext') => {
      return this.#chatTemplate.parseTemplate(value, language)();
    },
    getActionList: (value: string, language?: 'js' | 'plaintext') => {
      return this.#client.environment.pythonAddon.getPlayerIdList.query(
        undefined,
      );
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
    getUsageType: async () => {
      // todo 类型,应该是编辑器部分场景
      // tts,内联编辑器,文本就错
      return [
        { label: 'default', value: 'default' },
        { label: 'workflow-parser', value: 'workflow-parser' },
      ];
    },
    getUsageOutputs: async (value: any) => {
      console.log('getUsageOutputs',value);
      return (EntryObj as any)[value]??[];
    },
    editorInputChange: async (value: boolean) => {
      console.log('xxxx', value);
    },
  };
}
