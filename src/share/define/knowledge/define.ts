import clsx from 'clsx';
import {
  actions,
  asControl,
  asVirtualGroup,
  disableWhen,
  hideWhen,
  layout,
  setComponent,
} from '@piying/view-angular-core';
import * as v from 'valibot';
import { RowGrid2Class } from '../../mind';
import { EmbeddingTemplateObjectDefine } from '../knowledge-create/embeding-template';
import { map } from 'rxjs';

export const GroupIndexSchema = v.pipe(
  v.optional(v.boolean(), false),
  v.title('图索引'),
  v.description('使用大语言模型尝试对导入内容进行解析并构建出知识图谱供查询'),
  actions.wrappers.set(['tooltip', 'label']),
);
export const ChunkSizeSchema = v.pipe(
  v.optional(v.number(), 100),
  v.minValue(1),
  v.title('分隔长度'),
  v.description('知识库中每条内容保存的长度(近似)'),
  actions.wrappers.set(['tooltip', 'label']),
  actions.class.top('flex-1'),
);

export const NameSchema = v.pipe(
  v.string(),
  v.title('知识库名'),
  layout({ keyPath: ['#'] }),
);

export const DictOptionsDefine = v.pipe(
  v.object({
    useImage: v.pipe(
      v.optional(v.boolean(), false),
      v.title('图片检索'),
      v.description(
        '选中会自动尝试自动将词条中的图片进行识别,并返回对应的文字;目前此功能非常慢,使用前注意;不使用此功能不影响图片显示',
      ),
      actions.wrappers.set(['tooltip', 'label']),
    ),
    extractorWord: v.pipe(
      v.optional(v.boolean(), false),
      v.title('提取词条'),
      v.description('选中将词条内容生成实体文件存放;正常使用中不需要'),
      actions.wrappers.set(['tooltip', 'label']),
    ),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: clsx(RowGrid2Class) } },
  ]),
  layout({ priority: 3, keyPath: ['#'] }),
);

export const entityTypeListDefine = v.pipe(
  v.optional(v.array(v.string()), ['人物', '事件', '地点', '组织']),
  asControl(),
  v.title('类别列表'),
  v.description('需要从文章中提取的类别'),
  setComponent('chip-input-list'),
  actions.wrappers.set(['tooltip', 'label']),
  actions.inputs.set({
    addOnBlur: true,
    editable: true,
  }),
  layout({ keyPath: ['#'] }),
  hideWhen({
    disabled: true,
    listen: (fn) => {
      return fn({
        list: [['#', 'graphIndex']],
      }).pipe(map(({ list }) => !list[0]));
    },
  }),
);
// 数量类型
export const maxChunkAsyncDefine = v.pipe(
  v.optional(v.number(), 1),
  v.minValue(1),
  v.title('文本切片队列数量'),
  v.description('同时处理文本切片的数量,可以用来限制对话数量,视显存/内存而定'),
  actions.wrappers.set(['tooltip', 'label']),
);
// export const maxEmbeddingAsyncDefine = v.pipe(
//   v.optional(v.number(), 20),
//   v.title('文本嵌入队列数量'),
//   v.description(
//     '同时处理文本嵌入的数量,可以用来限制对话数量,视显存/内存而定\n一般不用限制太小,因为对话的速度比嵌入的速度慢的多,消耗比产生快',
//   ),
//   componentDefine({ wrappers: ['tooltip', ] }),
// );

// export const embeddingBatchCountDefine = v.pipe(
//   v.optional(v.number(), 16),
//   v.title('每批次嵌入数量'),
//   v.description('执行文本到向量操作时每次请求数量'),
//   componentDefine({ wrappers: ['tooltip', ] }),
// );

export const extractRetryDefine = v.pipe(
  v.optional(v.number(), 1),
  v.title('提取重试'),
  v.description('使用工作流提取数据时,如果出现异常重试的次数\n'),
  actions.wrappers.set(['tooltip', 'label']),
);
export const ExtractWorkflowDefine = v.pipe(
  v.optional(v.string(), 'default/[图谱知识库]图谱解析'),
  // v.metadata({ placeholder: '[请选择工作流]' }),
  setComponent('button-input'),
  actions.inputs.patch({
    allowClear: true,
    placeholder: '[请选择工作流]',
    shape: 'circle',
    style: 'ghost',
    content: { icon: { fontIcon: 'polyline' } },
  }),
  actions.inputs.patchAsync({
    clicked: (field) => () => {
      return field.context.selectWorkflow();
    },
  }),
  layout({ keyPath: ['#'] }),
  hideWhen({
    listen: (fn) => {
      return fn({
        list: [['#', 'graphIndex']],
      }).pipe(map(({ list }) => !list[0]));
    },
  }),
);
export const promptDefine = v.pipe(
  v.object({
    // extractEntity: createPromptDefine(
    //   '提取实体提示词(推荐使用工作流)',
    //   'extractEntity',
    // ),
    // extractKeyword: createPromptDefine('提取关键字', 'extractKeyword'),
    // ragResponse: createPromptDefine('对话', 'ragResponse'),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'flex gap-2' } },
  ]),
  layout({ keyPath: ['#'] }),
  hideWhen({
    disabled: true,

    listen: (fn) => {
      return fn({
        list: [['#', 'graphIndex']],
      }).pipe(map(({ list }) => !list[0]));
    },
  }),
);
const graphDisableWhen = <T>() =>
  disableWhen<T>({
    listen: (fn) => {
      return fn({
        list: [['#', 'graphIndex']],
      }).pipe(map(({ list }) => !list[0]));
    },
  });
const GraphRagLine1 = v.pipe(
  v.object({
    entityTypeList: v.pipe(entityTypeListDefine),
  }),
);
const GraphRagLine2 = v.pipe(
  v.object({
    maxChunkAsync: v.pipe(maxChunkAsyncDefine, graphDisableWhen()),
    // maxEmbeddingAsync: v.pipe(maxEmbeddingAsyncDefine, graphDisableWhen()),
    // embeddingBatchCount: v.pipe(embeddingBatchCountDefine, graphDisableWhen()),
    extractRetry: v.pipe(extractRetryDefine, graphDisableWhen()),
  }),

  actions.wrappers.patch([
    {
      type: 'div',
      attributes: { class: 'grid grid-cols-2 grid-rows-1 gap-2' },
    },
  ]),

  layout({ keyPath: ['#'] }),
  hideWhen({
    listen: (fn) => {
      return fn({
        list: [['#', 'graphIndex']],
      }).pipe(map(({ list }) => !list[0]));
    },
  }),
);
const GraphRagLine3 = v.pipe(
  v.object({
    extractWorkflow: v.pipe(ExtractWorkflowDefine, graphDisableWhen()),
    // prompt: v.pipe(promptDefine, graphDisableWhen()),
  }),
);
const GraphRagLine4 = v.object({
  embeddingTemplate: EmbeddingTemplateObjectDefine,
});

/** form使用 */
export const GraphRagFormOptionsDefine = v.pipe(
  v.intersect([GraphRagLine1, GraphRagLine2, GraphRagLine3, GraphRagLine4]),
  asVirtualGroup(),
);

// 用于创建可选,当前配置只有在图标时才是必选
export const CreateGraphRagOptionsDefine = v.object(
  v.entriesFromObjects([
    GraphRagLine1,
    GraphRagLine2,
    GraphRagLine3,
    GraphRagLine4,
  ]),
);
export const GraphRagOptionsDefine = v.object(
  v.entriesFromObjects([
    GraphRagLine1,
    GraphRagLine2,
    GraphRagLine3,
    // embeddingTemplate 是放在集合中的
  ]),
);
