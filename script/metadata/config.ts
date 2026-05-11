import { platform } from 'os';
import * as v from 'valibot';
import { LlamaConfigDefine } from '@shenghuabi/llama/define';
import {
  IndexTTSOptionsDefine,
  PythonAddonDefine,
  BackendDefine,
  TTSConfigDefine,
} from '@shenghuabi/python-addon/define';

import {
  ChatParamsItemDefine,
  ChatParamsListDefine,
} from '@shenghuabi/openai/define';
import { SpeedControlDefine } from '@shenghuabi/crunker/define';
import { omitIntersect } from '@piying/valibot-visit';
import { DownloadConfigDefine } from '@cyia/external-call';
import { QdrantOptionsDefine } from '@shenghuabi/knowledge/qdrant';
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
    v.description('定义每行开头会缩进几个字(需重启)'),
  ),

  'mind.editor.highlight': v.object({
    enable: v.optional(v.boolean(), true),
    sort: editorSortDefine,
  }),
  prompt: v.object({
    selection: v.pipe(
      v.optional(v.string()),
      v.description('编辑器中选中相关提示词配置文件路径'),
    ),
    common: v.pipe(
      v.optional(v.string()),
      v.description('通用的对话模板配置文件路径'),
    ),
  }),
  text2vec: EMBEDING,
  reranker: ReRanker,
  vector_database: v.pipe(
    v.optional(QdrantOptionsDefine, {}),
    v.description('向量数据库相关配置'),
  ),

  knowledge_base: v.pipe(
    v.optional(
      v.object({
        dir: v.pipe(v.optional(v.string()), v.description('知识库文件夹')),
      }),
    ),
    v.description('知识库配置'),
  ),

  ['ocr.dir']: v.pipe(v.optional(v.string()), v.description('OCR文件夹')),

  ['ocr.options']: v.object({
    device: v.pipe(
      v.optional(v.picklist(['dml', 'cuda', 'cpu']), 'cpu'),
      v.description(
        'windows下可以修改为dml,但是因为部分机器不支持导致错误,所以默认还是cpu',
      ),
    ),
    threads: v.pipe(
      v.optional(v.number(), 2),
      v.description(`使用线程数量,需要根据显存/内存判断`),
    ),
    mode: v.pipe(
      v.optional(v.picklist(ORC_LIST.map((item) => item.value)), 'ch_mobile'),
      v.description(
        `图像预处理，在图片外周添加白边，用于提升识别率，文字框没有正确框住所有文字时，增加此值`,
      ),
      v.metadata({
        enumOptions: ORC_LIST.map((item) => {
          return { label: item.label, description: item.label };
        }),
      }),
    ),
    padding: v.pipe(
      v.optional(v.number()),
      v.description(
        `图像预处理，在图片外周添加白边，用于提升识别率，文字框没有正确框住所有文字时，增加此值`,
      ),
    ),
    maxSideLen: v.pipe(
      v.optional(v.number()),
      v.description(
        `按图片最长边的长度，此值为0代表不缩放，例：1920，如果图片长边大于1920则把图像整体缩小到1920再进行图像分割计算，如果图片长边小于1920则不缩放，如果图片长边小于32，则缩放到32`,
      ),
    ),
    // boxScoreThresh: v.pipe(
    //   v.optional(v.number()),
    //   v.description(`文字框置信度门限，文字框没有正确框住所有文字时，减小此值`),
    // ),
    // boxThresh: v.pipe(v.optional(v.number()), v.description(``)),
    // unClipRatio: v.pipe(
    //   v.optional(v.number()),
    //   v.description(
    //     `单个文字框大小倍率，越大时单个文字框越大。此项与图片的大小相关，越大的图片此值应该越大`,
    //   ),
    // ),
    // doAngle: v.pipe(
    //   v.optional(v.number()),
    //   v.description(
    //     `启用(1)/禁用(0) 文字方向检测，只有图片倒置的情况下(旋转90~270度的图片)，才需要启用文字方向检测`,
    //   ),
    // ),
    // mostAngle: v.pipe(
    //   v.optional(v.number()),
    //   v.description(
    //     `启用(1)/禁用(0) 角度投票(整张图片以最大可能文字方向来识别)，当禁用文字方向检测时，此项也不起作用`,
    //   ),
    // ),
  }),
  ['defaultDir']: v.pipe(
    v.optional(v.string()),
    v.description(
      '默认文件夹.当知识库/向量数据库/模型路径未设置时使用此文件夹保存',
    ),
  ),
  chatHistory: v.object({
    dir: v.pipe(v.optional(v.string()), v.description('对话历史保存的文件夹')),
    enable: v.pipe(
      v.optional(v.boolean(), true),
      v.description('是否保存对话历史'),
    ),
  }),
  chatModelList: ChatParamsListDefine,

  download: v.object({
    direct: v.pipe(
      v.optional(v.boolean(), false),
      v.description(
        '优先直接下载,如果您的网络可以直接访问github,huggingface,请设置为true,如果您不理解什么意思,请保持不变',
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
      v.optional(v.string(), 'hg-model.tbontop.top'),
      v.description(
        [
          `原始: huggingface.co`,
          `huggingface模型下载镜像:`,
          `- hf-mirror: hf-mirror.com`,
          `- hf-mirror: alpha.hf-mirror.com`,
          `- cloudflare镜像: hg-model.tbontop.top`,
          `- edgeone镜像: hg-model2.tbontop.top`,
        ].join('\n'),
      ),
    ),

    strategy: v.optional(DownloadConfigDefine),
  }),

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
      '作为服务器,目前可用于远程执行工作流\n默认为:http://127.0.0.1:1127\n执行工作流:/workflow/exec\n执行工作流(流式返回):/workflow/stream',
    ),
  ),

  'fullText.workflowPath': v.pipe(
    v.string(),
    v.description('定义处理编辑器内全文内容的工作流'),
  ),
  'sentence.workflowPath': v.pipe(
    v.string(),
    v.description('定义处理编辑器内分割后每行的工作流'),
  ),
  'sentence.displayMode': v.pipe(
    v.optional(v.picklist(['diff', 'hover'])),
    v.description('行内操作后的显示模式'),
    v.metadata({
      enumOptions: [
        { label: 'diff', description: '左右编辑器显示不同' },
        { label: 'hover', description: '高亮显示,鼠标悬停修改' },
      ],
    }),
  ),
  'sentence.config': v.pipe(
    v.object({
      lineLength: v.pipe(
        v.optional(v.number(), 100),
        v.description('参考指定长度将文章分割为多段'),
      ),
    }),
    v.description('定义处理编辑器内分割相关配置'),
  ),
  ['word.threshold']: v.pipe(
    v.optional(
      v.tuple([v.number(), v.number(), v.number()]),
      [3000, 5000, 7000],
    ),
    v.description('定义文章字数范围提示'),
  ),
  'knowledge.query': v.pipe(
    v.object({
      limit: v.pipe(v.optional(v.number(), 10), v.description(`查询限制数量`)),
      list: v.pipe(
        v.optional(v.array(v.string())),
        v.description(`指定知识库查询时的查询范围及返回顺序`),
      ),
    }),
    v.description(`智能查询相关配置`),
  ),

  mind: v.pipe(
    v.object({
      dir: v.pipe(
        v.optional(v.string()),
        v.description('保存脑图相关配置的文件夹'),
      ),
    }),
    v.description('脑图相关配置'),
  ),
  'knowledgeGraph.view': v.pipe(
    v.optional(
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
            '节点着色用的颜色,使用时会根据传入颜色列表进行插值着色',
          ),
        ),
        coloringMethod: v.pipe(
          v.optional(
            v.picklist(KnowledgeGraphColoringMethod.map(({ value }) => value)),
            'community',
          ),

          v.description(`图谱节点的着色方式`),
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
  ),
  'search.article': v.object({
    embeding: v.optional(EMBEDING, {}),
    chunkSize: v.pipe(
      v.optional(v.number(), 200),
      v.description('文本切片长度'),
    ),
  }),

  'sentence.editor': editorChangeHoverMode,


  'llama.config': v.pipe(
    v.optional(LlamaConfigDefine, {
      server: {
        list: [],
      },
    }),
  ),
  'llama.startup': v.pipe(
    v.optional(v.boolean(), false),
    v.description('是否打开软件时自动启动'),
  ),
  'llama.dir': v.pipe(
    v.optional(v.string()),
    v.description('保存llama.cpp相关的文件夹'),
  ),
  'llama.listen': v.pipe(
    v.optional(v.string(), '127.0.0.1:12345'),
    v.description('目前为llama-swap监听地址,相当于llama.cpp的反向代理'),
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
          v.optional(v.string(), 'b6174'),
          v.description(
            'llama.cpp的版本号,可以从 https://github.com/ggerganov/llama.cpp/releases 获得',
          ),
        ),
      }),
      {},
    ),
  ),
  pythonAddon: v.object({
    ...v.omit(PythonAddonDefine, ['dir']).entries,
    dir: v.optional(v.string()),
  }),
  indexTTS: v.optional(IndexTTSOptionsDefine),
  tts: v.optional(TTSConfigDefine),
  hfToken: v.pipe(v.optional(v.string())),
  pdfAsImage: v.object({
    enable: v.optional(v.boolean()),
    viewPortOptions: v.optional(
      v.object({
        scale: v.optional(v.number()),
      }),
    ),
  }),
  'image.workflowPath': v.pipe(v.optional(v.string())),
});
