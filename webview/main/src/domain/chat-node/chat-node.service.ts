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

const EntryList = [
  {
    id: 'workflow-parser',
    list: [
      { label: '切片', name: 'chunk', id: 'chunk' },
      { label: '文件名', name: 'fileName', id: 'fileName' },
      { label: '实体类型列表', name: 'entityTypeList', id: 'entityTypeList' },
    ],
  },
  {
    id: 'image-parser',
    list: [
      { label: '文件路径', name: 'filePath', id: 'filePath' },
      { label: '前缀', name: 'prefix', id: 'prefix' },
      { label: '图片(buffer)', name: 'image', id: 'image' },
    ],
  },
  {
    // 返回文本
    id: 'file-sentence',
    list: [{ label: '每行内容', name: 'line', id: 'line' }],
  },
  {
    // 返回文本
    id: 'file-content',
    list: [{ label: '文件内容', name: 'content', id: 'content' }],
  },
  {
    id: 'file-tts',
    list: [
      // 返回obj
      { label: '文件路径', name: 'fullPath', id: 'fullPath' },
      { label: '相对文件路径', name: 'relFilePath', id: 'relFilePath' },
      { label: '文件夹', name: 'dir', id: 'dir' },
      { label: '文件内容', name: 'content', id: 'content' },
    ],
  },
  {
    id: 'graph-rag',
    list: [
      // 返回obj
      { label: '问题', name: 'question', id: 'question' },
      { label: '节点表', name: 'nodeTable', id: 'nodeTable' },
      { label: '边表', name: 'edgeTable', id: 'edgeTable' },
      { label: '切片内容', name: 'chunkContent', id: 'chunkContent' },
      { label: '上下文(对象)', name: 'context', id: 'context' },
    ],
  },
  {
    id: 'graph-key-extract',
    list: [
      // 返回obj
      { label: '问题', name: 'question', id: 'question' },
    ],
  },
  // todo 补全
  // {
  //   id: 'completion',
  //   list: [
  //     // 返回obj
  //     { label: '问题', name: 'question', id: 'question' },
  //     { label: '节点表', name: 'nodeTable', id: 'nodeTable' },
  //     { label: '边表', name: 'edgeTable', id: 'edgeTable' },
  //     { label: '切片内容', name: 'chunkContent', id: 'chunkContent' },
  //     { label: '上下文(对象)', name: 'context', id: 'context' },
  //   ],
  // },
];
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
            content: form.value ?? '',
            title: '代码节点编辑',
            output: (form as any).output,
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
        // { label: 'default', value: 'default' },
        ...EntryList.map((item) => ({ label: item.id, value: item.id })),
      ];
    },
    getUsageOutputs: async (value: any) => {
      console.log('getUsageOutputs', value);
      return EntryList.find((item) => item.id === value)?.list ?? [];
    },
    editorInputChange: async (value: boolean) => {
      console.log('xxxx', value);
    },
  };
}
