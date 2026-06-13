import { platform } from 'os';
import * as v from 'valibot';
import { LlamaConfigDefine } from '@shenghuabi/llama/define';
import {
  IndexTTSOptionsDefine,
  PythonAddonDefine,
  BackendDefine,
  TTSConfigDefine,
} from '@shenghuabi/python-addon/define';


import { SpeedControlDefine } from '@shenghuabi/crunker/define';
import { omitIntersect } from '@piying/valibot-visit';
import { DownloadConfigDefine } from '@cyia/external-call';
import { QdrantOptionsDefine } from '@shenghuabi/knowledge/qdrant';
import { ModelConfigDefine } from '@shenghuabi/openai/define';
const EmbedingStartupType = [
  { value: 'transformers', description: '内置' },
  { value: 'openai', description: '需要设置baseURL' },
] as const;
const ReRankerStartupType = [
  { value: 'transformers', description: '内置' },
] as const;

const EMBEDING = v.pipe(
  v.optional(
    v.object({
      startupType: v.pipe(
        v.optional(
          v.picklist(EmbedingStartupType.map(({ value }) => value)),
          'transformers',
        ),
        v.description('使用文本到向量的类型'),
        v.metadata({
          enumOptions: EmbedingStartupType.map((item) => {
            return { label: item.description, description: item.description };
          }),
        }),
      ),
      baseURL: v.pipe(
        v.optional(v.string(), 'http://127.0.0.1:11434/v1'),
        v.description('openai兼容接口(embeddings嵌入使用)'),
      ),
      apiKey: v.pipe(
        v.optional(v.string()),
        v.description('本地部署默认可以不填'),
      ),
      dir: v.pipe(
        v.optional(v.string()),
        v.description('text2vec模型文件夹(transformers使用)'),
      ),
      modelName: v.pipe(
        v.optional(v.string(), 'Xenova/bge-base-zh-v1.5'),
        v.description(
          '## 文本嵌入向量\n### 内置transformers模型推荐\n- `Xenova/bge-base-zh-v1.5`\n- `Xenova/bge-large-zh-v1.5`\n- `Xenova/bge-m3`\n',
        ),
      ),
      embeddingLength: v.pipe(
        v.optional(v.number()),
        v.description(
          '如果使用openAI兼容接口需要设置这个值,用来创建知识库时使用',
        ),
      ),
      dtype: v.pipe(
        v.optional(
          v.picklist([
            'fp32',
            'fp16',
            'q8',
            'int8',
            'uint8',
            'q4',
            'bnb4',
            'q4f16',
          ]),
          'fp16',
        ),
        v.description('dml: 建议fp16,fp32;\ncpu: q8,fp16,fp32'),
      ),
      device: v.pipe(
        v.optional(
          v.picklist(['cpu', 'dml', 'cuda']),
          platform() === 'linux' ? 'cpu' : 'dml',
        ),
        v.description('建议cpu+q8/dml+fp16\n'),
      ),
      maxBatchSize: v.pipe(
        v.optional(v.number(), 256),
        v.description(
          `每次处理的最大条数\n有效防止文本到向量处理太多时爆显存/内存\n默认256条`,
        ),
      ),
      maxAsyncCount: v.pipe(
        v.optional(v.number(), 10),
        v.description(`允许同时发送请求数量`),
      ),
      threads: v.pipe(
        v.optional(v.number(), 2),
        v.description(`使用线程数量,需要根据显存/内存判断`),
      ),
    }),
  ),
  v.description('文本嵌入相关配置(embedding)'),
);
export const ReRanker = v.pipe(
  v.optional(
    v.object({
      startupType: v.pipe(
        v.optional(
          v.picklist(ReRankerStartupType.map(({ value }) => value)),
          'transformers',
        ),
        v.description('使用Reranker重排序的类型'),
        v.metadata({
          enumOptions: ReRankerStartupType.map((item) => {
            return { label: item.description, description: item.description };
          }),
        }),
      ),

      dir: v.pipe(
        v.optional(v.string()),
        v.description('[transformers]模型文件夹'),
      ),
      modelName: v.pipe(
        v.optional(v.string(), 'Xenova/bge-reranker-base'),
        v.description(
          '## 文本嵌入向量\n### 内置transformers模型\n- `Xenova/bge-reranker-base`\n',
        ),
      ),

      dtype: v.pipe(
        v.optional(
          v.picklist([
            'fp32',
            'fp16',
            'q8',
            'int8',
            'uint8',
            'q4',
            'bnb4',
            'q4f16',
          ]),
          'fp16',
        ),
        v.description('[transformers]'),
      ),
      device: v.pipe(
        v.optional(
          v.picklist(['cpu', 'dml', 'cuda']),
          platform() === 'linux' ? 'cpu' : 'dml',
        ),
        v.description('[transformers]dml>cpu'),
      ),
      ratio: v.optional(v.number(), 5),
    }),
  ),
  v.description('文本重排序相关配置(reranker)'),
);

const KnowledgeGraphColoringMethod = [
  {
    value: 'community',
    label: '社区算法',
    description: '自动分类,按照联系着色',
  },
  { value: 'category', label: '指定分类', description: '按照指定的类别着色' },
] as const;
const editorSortList = [
  {
    value: 'longFirst',
    label: '长词优先',
    description: '长词优先',
  },
  {
    value: 'shortFirst',
    label: '短词优先',
    description: '短词优先',
  },
  {
    value: 'shortOnly',
    label: '只显示短词',
    description: '只显示短词',
  },
] as const;

const enableConfig = v.pipe(
  v.optional(v.boolean(), false),
  v.description('是否开启此配置'),
);
const ORC_LIST = [
  { label: '简体中文', value: 'ch_mobile' },
  { label: '简体中文(服务器)', value: 'ch_server' },
  { label: '繁體中文', value: 'chinese_cht' },
  { label: '英文', value: 'en_mobile' },
  { label: '阿拉伯文', value: 'ar_mobile' },
  { label: '塞尔维亚文', value: 'cyrillic_mobile' },
  { label: '梵文', value: 'devanagari_mobile' },
  { label: '日文', value: 'japan_mobile' },
  { label: '卡纳达语', value: 'ka_mobile' },
  { label: '韩文', value: 'korean_mobile' },
  { label: '拉丁文', value: 'latin_mobile' },
  { label: '泰米尔文', value: 'ta_mobile' },
  { label: '泰卢固文', value: 'te_mobile' },
] as const;

// 禁止对象默认值,设置默认值必须无法拆分
let editorSortDefine = v.pipe(
  v.optional(
    v.picklist(editorSortList.map(({ value }) => value)),
    editorSortList[1].value,
  ),

  v.description('高亮词语冲突时的显示模式'),
  v.metadata({
    enumOptions: editorSortList.map((item) => {
      return { label: item.label, description: item.description };
    }),
  }),
);
let editorChangeHoverMode = v.pipe(
  v.optional(
    v.object({
      highlight: v.pipe(
        v.optional(
          v.object({
            backgroundColor: v.pipe(
              v.optional(v.string()),
              v.description('背景颜色;格式 #000000'),
            ),
            outline: v.optional(v.string()),
            border: v.optional(v.string()),
            fontStyle: v.optional(v.string()),
            fontWeight: v.optional(v.string()),
            textDecoration: v.pipe(
              v.optional(v.string(), 'underline wavy red 2px'),
              v.description('下划线'),
            ),
            color: v.pipe(
              v.optional(v.string()),
              v.description('颜色;格式 #000000'),
            ),
            opacity: v.optional(v.string()),
            letterSpacing: v.optional(v.string()),
          }),
        ),
      ),
    }),
  ),
);
// todo 工作流配置
/** @internal */
export const CONFIG = v.object({
  // ai: z.object({
  //   action: z.object({
  //     chatList: z
  //       .object({ content: z.string().describe(`提示词`) })
  //       .array()
  //       .default([{ content: 'hello world' }]),
  //   }),
  // }),

  ['dict.editor.selectHover']: v.pipe(
    v.object({
      enable: v.pipe(v.optional(v.boolean(), true)),
      list: v.pipe(
        v.optional(v.array(v.string())),
        v.description(
          `指定查询字典列表,移除此配置表示使用所有字典,设置为[]表示不使用字典`,
        ),
      ),
      score: v.pipe(
        v.optional(v.number(), 1),
        v.description(`搜索相似度,设置为1表示精确搜索`),
      ),
      limit: v.pipe(v.optional(v.number(), 1), v.description(`最多返回数量`)),
    }),
    v.description('文本编辑器选中字符串时进行字典查询'),
  ),

  ['knowledgeGraph.editor']: v.pipe(
    v.object({
      enable: v.pipe(v.optional(v.boolean(), true)),
      list: v.pipe(
        v.optional(
          v.array(
            v.object({
              name: v.string(),
              highlight: v.pipe(
                v.optional(
                  v.object({
                    enable: enableConfig,
                    value: v.pipe(
                      v.optional(
                        v.object({
                          sort: editorSortDefine,
                          style: v.pipe(
                            v.optional(
                              v.object({
                                backgroundColor: v.optional(v.string()),
                                outline: v.optional(v.string()),
                                border: v.optional(v.string()),
                                fontStyle: v.optional(v.string()),
                                fontWeight: v.optional(v.string()),
                                textDecoration: v.pipe(
                                  v.optional(
                                    v.string(),
                                    'underline dotted #22ec1c 2px',
                                  ),
                                ),
                                color: v.optional(v.string()),
                                opacity: v.optional(v.string()),
                                letterSpacing: v.optional(v.string()),
                              }),
                              {},
                            ),
                          ),
                        }),
                        {},
                      ),
                    ),
                  }),
                  {},
                ),
                v.description('高亮配置'),
              ),

              completion: v.pipe(
                v.optional(
                  v.object({
                    enable: enableConfig,
                    value: v.pipe(
                      v.optional(
                        v.object({
                          pinyin: v.pipe(
                            v.optional(v.boolean()),
                            v.description('是否开启拼音补全'),
                          ),
                        }),
                      ),
                    ),
                  }),
                ),
                v.description('补全配置'),
              ),
            }),
          ),
          [],
        ),
      ),
    }),
    v.description('知识图谱在编辑器中的配置(高亮,补全)'),
  ),

  'editor.text-indent': v.pipe(
    v.optional(v.number(), 2),
    v.description('编辑器中文本每行开头的缩进字数，使用全角空格实现(需重启)'),
  ),

  'mind.editor.highlight': v.pipe(
    v.object({
      enable: v.optional(v.boolean(), true),
      sort: editorSortDefine,
    }),
    v.description('编辑器中脑图高亮词语的配置'),
  ),
  prompt: v.pipe(
    v.object({
      selection: v.pipe(
        v.optional(v.string()),
        v.description('编辑器中选中文字后使用的提示词模板配置文件路径'),
      ),
      common: v.pipe(
        v.optional(v.string()),
        v.description('通用对话模板配置文件路径'),
      ),
    }),
    v.description('编辑器提示模板词路径配置'),
  ),
  text2vec: v.pipe(
    EMBEDING,
    v.description('文本嵌入向量(text2vec)配置，用于将文本转换为向量表示'),
  ),
  reranker: v.pipe(
    ReRanker,
    v.description('文本重排序(reranker)配置，用于知识库查询结果相关性排序'),
  ),
  vector_database: v.pipe(
    v.optional(QdrantOptionsDefine, {}),
    v.description('向量数据库(qdrant)配置'),
  ),

  knowledge_base: v.pipe(
    v.optional(
      v.object({
        dir: v.pipe(
          v.optional(v.string()),
          v.description('知识库文件存储目录路径'),
        ),
      }),
    ),
    v.description('知识库相关配置'),
  ),

  ['ocr.dir']: v.pipe(
    v.optional(v.string()),
    v.description('OCR引擎模型文件夹路径(paddlepaddle v4)'),
  ),

  ['ocr.options']: v.pipe(
    v.object({
      device: v.pipe(
        v.optional(v.picklist(['dml', 'cuda', 'cpu']), 'cpu'),
        v.description(
          `OCR推理设备选择，windows下可选dml(DirectML加速)，linux仅支持cpu`,
        ),
      ),
      threads: v.pipe(
        v.optional(v.number(), 2),
        v.description(`OCR处理使用的线程数量,根据显存/内存大小调整`),
      ),
      mode: v.pipe(
        v.optional(v.picklist(ORC_LIST.map((item) => item.value)), 'ch_mobile'),
        v.description(`OCR识别语言模式选择`),
        v.metadata({
          enumOptions: ORC_LIST.map((item) => {
            return { label: item.label, description: item.label };
          }),
        }),
      ),
      padding: v.pipe(
        v.optional(v.number()),
        v.description(`图像预处理白边大小，提升文字框边缘的识别率`),
      ),
      maxSideLen: v.pipe(
        v.optional(v.number()),
        v.description(
          `图片最长边最大像素值，超过则等比缩放后处理，0表示不限制`,
        ),
      ),
    }),
    v.description('OCR图像识别配置参数'),
  ),
  ['defaultDir']: v.pipe(
    v.optional(v.string()),
    v.description(
      '全局默认工作目录，知识库/向量数据库/模型等路径未指定时将使用此目录作为存储根目录',
    ),
  ),
  chatHistory: v.pipe(
    v.object({
      dir: v.pipe(
        v.optional(v.string()),
        v.description('AI对话历史记录保存的目录路径'),
      ),
      enable: v.pipe(
        v.optional(v.boolean(), true),
        v.description('是否启用对话历史自动保存功能'),
      ),
    }),
    v.description('AI对话历史管理配置，包括保存开关和存储位置'),
  ),
  chatModelList: v.array(ModelConfigDefine),

  download: v.pipe(
    v.object({
      direct: v.pipe(
        v.optional(v.boolean(), false),
        v.description(
          '是否优先通过直连方式下载资源（无法访问GitHub/HuggingFace时建议关闭）',
        ),
      ),
      softwareMirror: v.pipe(
        v.optional(v.string(), `github-release.tbontop.top`),
        v.description(
          [
            `原始: github.com`,
            '软件镜像(github加速)',
            `- cloudflare镜像: github-release.tbontop.top`,
            `- edgeone镜像: github-release2.tbontop.top`,
          ].join('\n'),
        ),
      ),
      // 把原版也加上
      huggingfaceModelMirror: v.pipe(
        v.optional(v.string(), 'hf-mirror.com'),
        v.description(
          [
            `原始: huggingface.co`,
            `huggingface模型下载镜像:`,
            `- hf-mirror: hf-mirror.com`,
            `- hf-mirror: alpha.hf-mirror.com`,
          ].join('\n'),
        ),
      ),

      strategy: v.optional(DownloadConfigDefine),
    }),
    v.description(
      '资源下载相关配置，包含直连开关、GitHub软件镜像、HF模型镜像等',
    ),
  ),

  workflow: v.pipe(
    v.object({
      dir: v.pipe(v.optional(v.string()), v.description('工作流文件夹')),
    }),
    v.description('工作流相关配置'),
  ),
  server: v.pipe(
    v.optional(
      v.object({
        enable: v.optional(v.boolean(), false),
        port: v.optional(v.number(), 1127),
        host: v.optional(v.string(), '127.0.0.1'),
      }),
      {},
    ),
    v.description(
      '内置HTTP服务器配置，用于远程执行工作流API服务\n默认为:http://127.0.0.1:1127\n执行工作流:/workflow/exec\n执行工作流(流式返回):/workflow/stream',
    ),
  ),

  'file-content.workflowPath': v.pipe(
    v.string(),
    v.description('编辑器中全文操作时关联执行的工作流'),
  ),
  'file-sentence.workflowPath': v.pipe(
    v.string(),
    v.description('编辑器中按行分割内容后关联执行的工作流'),
  ),
  'sentence.displayMode': v.pipe(
    v.optional(v.picklist(['diff', 'hover']), 'diff'),
    v.description('句子级别工作流处理后结果的展示方式'),
    v.metadata({
      enumOptions: [
        { label: 'diff', description: '左右编辑器并排显示不同' },
        { label: 'hover', description: '行内高亮显示，鼠标悬停查看修改' },
      ],
    }),
  ),

  ['word.threshold']: v.pipe(
    v.optional(
      v.tuple([v.number(), v.number(), v.number()]),
      [3000, 5000, 7000],
    ),
    v.description(
      '文章字数阶梯阈值提示[tier1, tier2, tier3]，用于状态栏显示不同字数级别的提示',
    ),
  ),
  'knowledge.query': v.pipe(
    v.object({
      limit: v.pipe(
        v.optional(v.number(), 10),
        v.description('侧边栏知识库每次查询返回的最大结果条数'),
      ),
      list: v.pipe(
        v.optional(v.array(v.string())),
        v.description('指定知识库集合的查询范围和返回结果的排序顺序'),
      ),
    }),
    v.description('知识库智能搜索查询配置'),
  ),

  mind: v.pipe(
    v.object({
      dir: v.pipe(
        v.optional(v.string()),
        v.description('脑图数据文件及配置的存储目录'),
      ),
    }),
    v.description('脑图相关配置'),
  ),
  'knowledgeGraph.view': v.optional(
    v.object({
      color: v.pipe(
        v.optional(v.array(v.string()), [
          '#808080',
          '#008000',
          '#0000ff',
          '#800080',
          '#ffa500',
          '#ffd700',
          '#ff0000',
        ]),
        v.description(
          '图谱节点着色时使用的颜色列表，系统会根据分类数量进行插值计算',
        ),
      ),
      coloringMethod: v.pipe(
        v.optional(
          v.picklist(KnowledgeGraphColoringMethod.map(({ value }) => value)),
          'community',
        ),

        v.description(`知识图谱节点着色策略`),
        v.metadata({
          enumOptions: KnowledgeGraphColoringMethod.map((item) => ({
            label: item.label,
            description: item.description,
          })),
        }),
      ),
    }),
    {},
  ),
  // todo 已废弃?
  'search.article': v.object({
    embeding: v.optional(EMBEDING, {}),
    chunkSize: v.pipe(
      v.optional(v.number(), 200),
      v.description('文章搜索中文本分片的字符长度'),
    ),
  }),

  'sentence.editor': v.pipe(
    editorChangeHoverMode,
    v.description('句子级别编辑/纠错时在编辑器中的悬停高亮样式配置'),
  ),

  'llama.config': v.pipe(
    v.optional(LlamaConfigDefine, {
      server: {
        list: [],
      },
    }),
    v.description('本地LLM模型(llama.cpp)服务器连接配置'),
  ),
  'llama.startup': v.pipe(
    v.optional(v.boolean(), false),
    v.description('是否自动启动本地LLM服务器进程'),
  ),
  'llama.dir': v.pipe(
    v.optional(v.string()),
    v.description('llama.cpp运行时的存储目录'),
  ),
  'llama.listen': v.pipe(
    v.optional(v.string(), '127.0.0.1:12345'),
    v.description('llama-swap反向代理服务监听地址(包含端口)'),
  ),

  'llama-swap.install': v.pipe(
    v.optional(
      v.object({
        version: v.pipe(
          v.optional(v.string(), 'v160'),
          v.description(
            'llama-swap的版本号,可以从 https://github.com/mostlygeek/llama-swap/releases 获得',
          ),
        ),
        llamaVersion: v.pipe(
          v.optional(v.string(), 'b9442'),
          v.description(
            'llama.cpp的版本号,可以从 https://github.com/ggerganov/llama.cpp/releases 获得',
          ),
        ),
      }),
      {},
    ),
    v.description(
      'llama-swap服务配置',
    ),
  ),
  pythonAddon: v.pipe(
    v.object({
      ...v.omit(PythonAddonDefine, ['dir']).entries,
      dir: v.optional(v.string()),
    }),
    v.description('Python插件/扩展配置，包含TTS等Python功能的运行环境'),
  ),
  indexTTS: v.pipe(
    v.optional(IndexTTSOptionsDefine),
    v.description('语音索引工具(IndexTTS)配置，用于文本转语音的预处理和索引'),
  ),
  tts: v.pipe(
    v.optional(TTSConfigDefine),
    v.description('文本转语音(TTS)工作流配置'),
  ),
  hfToken: v.pipe(
    v.optional(v.string()),
    v.description('HuggingFace API访问令牌，用于下载受权限保护的模型'),
  ),
  pdfAsImage: v.pipe(
    v.object({
      enable: v.optional(v.boolean()),
      viewPortOptions: v.optional(
        v.object({
          scale: v.optional(v.number()),
        }),
      ),
    }),
    v.description('将PDF页面渲染为图像的配置，包含缩放比例参数'),
  ),
  'image-parser.workflowPath': v.pipe(
    v.optional(v.string()),
    v.description('pdf视为图片处理操作时关联执行的工作流路径'),
  ),
});
