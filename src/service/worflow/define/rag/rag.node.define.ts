import * as v from 'valibot';
import { selectOptions } from '@share/valibot';
import { actions, setComponent } from '@piying/view-angular-core';
import { TextareaTemplateDefine } from '@shenghuabi/workflow/share';
const modeList = [
  {
    label: '低阶',
    value: 'local',
  },
  {
    label: '高阶',
    value: 'global',
  },
  {
    label: '混合',
    value: 'hybrid',
  },
] as const;
export const RAG_NODE_DEFINE = v.pipe(
  v.object({
    // llm: v.optional(llmModelConfig({ label: '对话模型' })),
    // 数组引用
    name: v.pipe(
      v.string(),
      v.title('知识库'),
      v.description('需要创建的知识库启用图索引'),
      setComponent('picklist'),
      actions.wrappers.set(['tooltip', 'label']),
      actions.inputs.set({ options: [] }),
      actions.inputs.patchAsync({
        options: (field) => field.context.selectRagKnowledgeList(),
      }),
      v.metadata({
        toolJsonSchema: {
          needKnowledgeGraph: true,
        },
      }),
    ),
    // todo 划分组
    disableKeywordExtract: v.pipe(
      v.optional(v.boolean(), false),
      v.title('禁用关键词提取'),
      v.description('禁用后会直接使用使用输入内容进行查询'),

      actions.wrappers.set([
        { type: 'div', attributes: { class: '!flex-none' } },
        'tooltip',
        'label',
      ]),
    ),
    mode: v.pipe(
      v.optional(v.picklist(modeList.map((item) => item.value)), 'local'),
      selectOptions(modeList),
    ),
    topK: v.pipe(
      v.optional(v.number(), 20),
      v.title('查询数量'),
      v.description('查询节点或边时的数量'),
      actions.wrappers.set(['tooltip', 'label']),
    ),
    lengthLimit: v.object({
      chunk: v.pipe(
        v.optional(v.number(), 2000),
        v.title('内容长度限制'),
        v.description('使用文章切片总长度限制(超过会抛弃后面)'),
        actions.wrappers.set(['tooltip', 'label']),
      ),
      node: v.pipe(
        v.optional(v.number(), 2000),
        v.title('实体长度限制'),
        v.description('使用实体数据总长度限制(超过会抛弃后面)'),
        actions.wrappers.set(['tooltip', 'label']),
      ),
      edge: v.pipe(
        v.optional(v.number(), 2000),
        v.title('关系长度限制'),
        v.description('使用关系数据总长度限制(超过会抛弃后面)'),
        actions.wrappers.set(['tooltip', 'label']),
      ),
      nodeDescription: v.pipe(
        v.optional(v.number(), 300),
        v.title('节点描述长度限制'),
        v.description('描述过长时会抛弃不相关的描述'),
      ),
    }),
    workflow: v.pipe(
      v.object({
        extractKeyword: v.pipe(
          v.optional(v.string(), 'default/[图谱知识库]提取关键字'),
          // v.description('提取关键字'),
          setComponent('button-input'),
          actions.inputs.patch({
            // allowClear: true,
            placeholder: '[请选择工作流提取关键字]',
            shape: 'circle',
            style: 'ghost',
            content: { icon: { fontIcon: 'polyline' } },
          }),
          actions.inputs.patchAsync({
            clicked: (field) => () => {
              return field.context.selectWorkflow();
            },
          }),
          actions.wrappers.patch(['label']),
          actions.class.top('flex-1'),
          v.title('提取关键字'),
          v.metadata({
            toolJsonSchema: {
              replaceSchema: v.literal('default/[图谱知识库]提取关键字'),
            },
          }),
        ),
        ragResponse: v.pipe(
          v.optional(v.string(), 'default/[图谱知识库]增强生成'), // asControl(),
          // v.description('对话'),

          setComponent('button-input'),
          actions.inputs.patch({
            placeholder: '[请选择工作流生成回答]',
            content: { icon: { fontIcon: 'polyline' } },
            shape: 'circle',
          }),
          actions.inputs.patchAsync({
            clicked: (field) => {
              return () => field.context.selectWorkflow();
            },
          }),
          actions.wrappers.patch(['label']),
          actions.class.top('flex-1'),
          v.title('对话'),
          v.metadata({
            toolJsonSchema: {
              replaceSchema: v.literal('default/[图谱知识库]增强生成'),
            },
          }),
        ),
      }),

      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'flex gap-2' } },
      ]),
    ),
    searchContent: v.pipe(
      TextareaTemplateDefine,
      v.title('搜索内容'),
      actions.wrappers.patch(['label']),
      v.metadata({
        toolJsonSchema: {
          replaceSchema: v.string(),
        },
      }),
    ),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid gap-2' } },
  ]),
);
