import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrpcService } from '@fe/trpc';
import * as v from 'valibot';
import { asColumn, asRow } from '@share/valibot';
import { asVirtualGroup } from '@piying/view-angular';
import { PiyingView } from '@piying/view-angular';

import { filter, map, debounceTime } from 'rxjs';
import {
  AsyncProperty,
  hideWhen,
  NFCSchema,
  setComponent,
  valueChange,
  actions,
} from '@piying/view-angular-core';
import { DefaultFormTypes, Wrappers } from '@fe/form/default-type-config';
import { ProgressComponent, ProgressInfo } from '../progress/component';
import { metadataPipe } from '@piying/valibot-visit';
import {
  StartDownloadMessage,
  EndDownloadMessage,
  ErrorDownloadMessage,
  FileLineDefine,
  createProgress,
} from '../const';
import { ChatParamsListDefine } from '@shenghuabi/openai/define';
import { InstallSchemaHandle } from '@fe/form/schema-handle/chat.schema-handle';
const device = [
  { label: 'cpu', value: 'cpu' },
  { label: 'dml', value: 'dml', description: 'windows directml' },
  { label: 'cuda', value: 'cuda', description: '仅在Linux下的N卡可用' },
] as const;

const EmbedingbackendList = [
  {
    label: '使用transformers',
    value: 'transformers',
    description: '使用内置transformers',
  },

  {
    label: 'openai兼容',
    value: 'openai',
    description: '',
  },
] as const;
const RerankerbackendList = [
  {
    label: '使用transformers',
    value: 'transformers',
    description: '使用内置transformers',
  },
] as const;
const DTYPE = [
  'fp32',
  'fp16',
  'q8',
  'int8',
  'uint8',
  'q4',
  'bnb4',
  'q4f16',
] as const;
const DTYPE_LIST = DTYPE.map((item) => ({ label: item, value: item }));
const Status = {
  running: {
    label: '运行中',
    color: 'primary',
    icon: {
      fontIcon: 'done',
    },
  },
  installed: {
    label: '已安装',
    color: 'primary',
    icon: {
      fontIcon: 'done',
    },
  },
  uninstalled: {
    label: '未安装',
    color: 'warn',
    icon: {
      fontIcon: 'close',
    },
  },
  starting: {
    label: '启动中',
    color: 'accent',
    icon: {
      fontIcon: 'starting',
    },
  },
  stopped: {
    label: '已停止',
    color: 'accent',
    icon: {
      fontIcon: 'stop',
    },
  },
  failed: {
    label: '失败',
    color: 'warn',
    icon: {
      fontIcon: 'error',
    },
  },
  default: {
    label: '未知',
    color: 'warn',
    icon: {
      fontIcon: 'question_mark',
    },
  },
  unknown: {
    label: '未知',
    color: 'warn',
    icon: {
      fontIcon: 'question_mark',
    },
  },
};
const StatusPipe = metadataPipe(
  setComponent('icon-label'),
  actions.inputs.set({
    defaultStatus: 'default',
    options: Status,
  }),
  actions.class.top('!flex-none'),
);
function createStatus(status: { status: AsyncProperty; channel: string }) {
  return v.object({
    __ollamaStatus1: v.pipe(
      NFCSchema,
      ...StatusPipe,
      actions.inputs.patchAsync({
        status: (field) => {
          return computed(() => status.status(field)?.installStatus);
        },
      }),
    ),
    __ollamaStatus2: v.pipe(
      NFCSchema,
      ...StatusPipe,
      actions.inputs.patchAsync({
        status: (field) => {
          return computed(() => status.status(field)?.runningStatus);
        },
        clicked: (field) => {
          return () => {
            const channel = status.channel;
            field.context['showChannel'](channel);
          };
        },
      }),
    ),
  });
}

function embeddingShow<T>(input: string) {
  return hideWhen<T>({
    listen: (fn) => {
      return fn({
        list: [['..', 'startupBackend']],
      }).pipe(map(({ list }) => list[0] !== input));
    },
  });
}

/** 词嵌入 */
const EmbeddingDefine = v.pipe(
  v.intersect([
    v.object({
      startupBackend: v.pipe(
        v.optional(v.picklist(EmbedingbackendList.map((item) => item.value))),
        setComponent('radio'),
        actions.inputs.patch({
          options: EmbedingbackendList,
        }),
        actions.wrappers.patch([
          { type: 'div', attributes: { class: 'flex gap-2' } },
        ]),
      ),
    }),
    v.pipe(
      v.object({
        transformersConfig: v.pipe(
          v.intersect([
            v.pipe(FileLineDefine, asRow()),
            v.pipe(
              v.object({
                modelName: v.pipe(
                  v.optional(v.pipe(v.string(), v.trim())),
                  v.title('模型名'),
                ),
                device: v.pipe(
                  v.optional(v.picklist(device.map((item) => item.value))),
                  actions.inputs.patch({ options: device }),
                  v.title('设备'),
                ),
                __downloadModel: v.pipe(
                  NFCSchema,
                  setComponent('button'),
                  actions.inputs.set({
                    // type: 'flat',
                    content: '下载',
                  }),
                  actions.class.top('flex-none!'),
                  actions.inputs.patchAsync({
                    clicked: (field) => () => {
                      const transformerConfig = field.form.parent.value;
                      field.context['downloadEmbeddingModel'](
                        transformerConfig,
                      );
                    },
                  }),
                ),
              }),
              actions.wrappers.patch([
                {
                  type: 'div',
                  attributes: {
                    class: 'flex gap-2 *:flex-1 items-end',
                  },
                },
              ]),
            ),
            v.pipe(
              v.object({
                __modelProgress: createProgress({
                  info: (field) =>
                    field.context['embeddingModelDownloadProgress$'],
                }),
              }),
            ),
          ]),
          asColumn(),
          asVirtualGroup(),
        ),
      }),
      embeddingShow('transformers'),
    ),
    v.pipe(v.object({}), embeddingShow('openai')),
  ]),
  asColumn(),
  asVirtualGroup(),
);

const ReRankerDefine = v.pipe(
  v.intersect([
    v.object({
      startupBackend: v.pipe(
        v.optional(v.picklist(RerankerbackendList.map((item) => item.value))),
        setComponent('radio'),
        actions.inputs.set({
          options: RerankerbackendList,
        }),
      ),
    }),
    v.pipe(
      v.intersect([
        v.object({
          transformersConfig: v.pipe(
            v.intersect([
              v.pipe(FileLineDefine, asRow()),
              v.pipe(
                v.object({
                  modelName: v.pipe(
                    v.optional(v.pipe(v.string(), v.trim())),
                    v.title('模型名'),
                  ),
                  device: v.pipe(
                    v.optional(v.picklist(device.map((item) => item.value))),
                    actions.inputs.patch({ options: device }),
                    v.title('设备'),
                  ),
                  dtype: v.pipe(
                    v.optional(v.picklist(DTYPE)),
                    actions.inputs.patch({ options: DTYPE_LIST }),
                    v.title('类型'),
                  ),
                  __downloadModel: v.pipe(
                    NFCSchema,
                    setComponent('button'),
                    actions.inputs.set({
                      // type: 'flat',
                      content: '下载',
                    }),
                    actions.class.top('!flex-none'),
                    actions.inputs.patchAsync({
                      clicked: (field) => () => {
                        const modelConfig = field.form.parent.value;
                        return field.context['downloadRerankerModel'](
                          modelConfig,
                        );
                      },
                    }),
                  ),
                }),
                actions.wrappers.patch([
                  {
                    type: 'div',
                    attributes: {
                      class: 'flex gap-2 *:flex-1 items-end',
                    },
                  },
                ]),
              ),
            ]),
            asColumn(),
            asVirtualGroup(),
          ),
        }),
      ]),
      asColumn(),
      asVirtualGroup(),
    ),
    v.pipe(
      v.object({
        __progress: createProgress({
          info: (field) =>
            field.context['rerankerTransfomersModelDownloadProgress$'],
        }),
      }),
    ),
  ]),
  asColumn(),
  asVirtualGroup(),
);
const LLMDefine = v.object({
  startup: v.pipe(
    v.optional(v.boolean(), false),
    v.title('开启llama'),
    actions.props.patch({ labelPosition: 'left' }),
  ),
  llamaConfig: v.pipe(
    v.intersect([
      v.pipe(
        v.object({
          ...FileLineDefine.entries,
          ...createStatus({
            status: (field) => field.context['llamacppStatus$'](),
            channel: 'llama.cpp',
          }).entries,
          __downloadModel: v.pipe(
            NFCSchema,
            setComponent('button'),
            actions.inputs.set({
              // type: 'flat',
              content: '下载',
            }),
            actions.class.top('!flex-none'),
            actions.inputs.patchAsync({
              content: (field) => {
                return computed(() =>
                  field.context['llamaUpdate$']() ? '升级' : '下载',
                );
              },
              disabled: (field) => {
                return field.context['disablellamaDownload$'];
              },
              clicked: (field) => {
                return () => {
                  return field.context['downloadLlama']();
                };
              },
            }),
          ),
        }),
        asRow(),
      ),
      v.object({
        __modelProgress: createProgress({
          info: (field) => field.context['llamaSwapDownloadProgress$'],
        }),
      }),
      v.pipe(
        v.object({
          modelList: v.pipe(
            v.optional(v.any()),
            setComponent('llama-model-config'),
            actions.outputs.patchAsync({
              newChange: (field) => (item: any) => {
                field
                  .get(['..', 'modelName'])
                  ?.form.control?.updateValue(item.model);
              },
            }),
          ),
          modelName: v.pipe(
            v.optional(v.string()),
            v.title('调用模型'),
            setComponent('select2'),
            actions.props.patch({
              options: [],
              maxListCount: 999,
            }),
            actions.props.patchAsync({
              options: (field) => {
                return field
                  .get(['..', 'modelList'])
                  ?.form.control?.valueChanges.pipe(
                    filter(Boolean),
                    map((list) => {
                      return list.map((item: any) => {
                        return { label: item.model, value: item.model };
                      });
                    }),
                  );
              },
            }),
          ),
        }),
      ),
    ]),
    asVirtualGroup(),
    asColumn(),
    actions.wrappers.patch(['card']),
  ),
});
const Define = v.pipe(
  v.intersect([
    v.pipe(
      v.object({
        download: v.pipe(
          v.object({
            direct: v.pipe(
              v.optional(v.boolean()),
              setComponent('toggle'),
              actions.props.patchAsync({
                title: (field) => {
                  return field.form.control!.valueChanges.pipe(
                    map((value: boolean) => {
                      return value ? '直接下载优先' : '镜像下载优先';
                    }),
                  );
                },
              }),
              v.description('如果您可以访问github/huggingface请开启此选项'),
            ),
          }),
        ),
      }),
    ),
    v.pipe(
      v.intersect([
        v.pipe(
          v.object({
            qdrant: v.pipe(
              v.intersect([
                v.pipe(
                  v.object({
                    ...FileLineDefine.entries,
                    ...createStatus({
                      status: (field) => field.context['qdrantStatus$'](),
                      channel: 'qdrant',
                    }).entries,
                    __downloadModel: v.pipe(
                      NFCSchema,
                      setComponent('button'),
                      actions.inputs.set({
                        // type: 'flat',
                        content: '下载',
                      }),
                      actions.class.top('!flex-none'),
                      actions.inputs.patchAsync({
                        content: (field) => {
                          return computed(() =>
                            field.context['qdrantUpdate$']() ? '升级' : '下载',
                          );
                        },
                        clicked: (field) => () => {
                          return field.context['downloadQdrant']();
                        },
                        disabled: (field) => {
                          return field.context['disableQdrantDownload$'];
                        },
                      }),
                    ),
                  }),
                  asRow(),
                ),
                v.object({
                  __progress: createProgress({
                    info: (field) => field.context['qdrantDownloadProgress$'],
                  }),
                }),
              ]),
              asVirtualGroup(),
              asColumn(),
            ),
          }),
          v.title('向量数据库'),
          v.description('保存模型处理过的向量数据'),
        ),
        v.pipe(
          v.object({
            embedding: v.pipe(
              EmbeddingDefine,
              valueChange((fn, field) => {
                fn()
                  .pipe(debounceTime(1000))
                  .subscribe(({ list: [value], field }) => {
                    field.context['toggleEmbedding'](value);
                  });
              }),
            ),
          }),
          v.title('文本到向量模型(Embedding)'),
          v.description('将导入的文本内容转换为向量;使用时不存在会自动下载'),
        ),
        v.pipe(
          v.object({
            reranker: ReRankerDefine,
          }),
          v.title('重排序模型(ReRanker)'),
          v.description('提高准确率'),
        ),
        v.pipe(
          v.object({
            llm: LLMDefine,
          }),
          v.title('大语言模型(LLM)'),
          v.description('AI对话使用的模型;使用或调用现有openai兼容接口'),
        ),
        v.pipe(
          v.object({
            chatModelList: v.pipe(v.optional(ChatParamsListDefine)),
          }),
          v.title('模型配置列表'),
        ),
      ]),
      setComponent('card-group'),
      asVirtualGroup(),
    ),
    v.pipe(
      v.object({
        __test: v.pipe(
          NFCSchema,
          setComponent('button'),
          actions.inputs.set({
            // type: 'flat',
            content: '测试',
          }),
          actions.inputs.patchAsync({
            clicked: (field) => {
              return () => field.context['chatTest']();
            },
          }),
        ),
        __testProgress: createProgress({
          info: (field) => field.context['testMessage$'],
        }),
      }),
      asColumn(),
      actions.class.top('mt-2', true),
    ),
  ]),
  asVirtualGroup(),
);

const FieldGlobalConfig = {
  types: {
    ...DefaultFormTypes,
    progress: {
      type: ProgressComponent,
    },
  },
  wrappers: {
    ...Wrappers,
  },
};
@Component({
  selector: `chat-install`,
  templateUrl: './component.html',
  standalone: true,
  imports: [FormsModule, PiyingView],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallConfigurationComponent implements OnInit {
  #client = inject(TrpcService).client;
  readonly define = v.pipe(
    Define,
    actions.hooks.merge({
      allFieldsResolved: (field) => {
        field.form.root.valueChanges
          .pipe(
            filter(() => {
              return field.form.root.touched || field.form.root.dirty;
            }),
          )
          .subscribe((value) => {
            this.modelChange(value);
          });
      },
    }),
  );
  model$ = signal<v.InferOutput<typeof Define>>({} as any);
  context = this;

  qdrantUpdate$ = signal<boolean>(false);
  llamaUpdate$ = signal<boolean>(false);
  disableQdrantDownload$ = computed<boolean>(() => {
    return !(
      this.qdrantUpdate$() ||
      this.qdrantStatus$()?.installStatus !== 'installed'
    );
  });

  disablellamaDownload$ = computed<boolean>(() => {
    return !(
      this.llamaUpdate$() ||
      this.llamacppStatus$()?.installStatus !== 'installed'
    );
  });

  llamacppStatus$ = signal<
    { installStatus: string; runningStatus: string } | undefined
  >(undefined);
  qdrantStatus$ = signal<
    { installStatus: string; runningStatus: string } | undefined
  >(undefined);
  qdrantDownloadProgress$ = signal<ProgressInfo | undefined>(undefined);
  embeddingModelDownloadProgress$ = signal<ProgressInfo | undefined>(undefined);
  rerankerTransfomersModelDownloadProgress$ = signal<ProgressInfo | undefined>(
    undefined,
  );
  testMessage$ = signal<ProgressInfo | undefined>(undefined);
  llamaSwapDownloadProgress$ = signal<ProgressInfo | undefined>(undefined);

  downloadEmbeddingModel(modelName: string) {
    return new Promise<void>((resolve, reject) => {
      this.embeddingModelDownloadProgress$.set(StartDownloadMessage);
      this.#client.environment.text2vec.download.subscribe(modelName, {
        onData: (data) => {
          this.embeddingModelDownloadProgress$.set(data);
        },
        onComplete: () => {
          this.embeddingModelDownloadProgress$.set(EndDownloadMessage);
          resolve();
        },
        onError: (e) => {
          this.embeddingModelDownloadProgress$.set(ErrorDownloadMessage);
          reject(e);
        },
      });
    });
  }

  downloadLlama() {
    return new Promise<void>((resolve, reject) => {
      this.llamaSwapDownloadProgress$.set(StartDownloadMessage);

      this.#client.environment.llamaSwap.download.subscribe(undefined, {
        onData: (data) => {
          this.llamaSwapDownloadProgress$.set(data);
        },
        onComplete: () => {
          this.#checkUpdate();
          this.llamaSwapDownloadProgress$.set(EndDownloadMessage);
          resolve();
        },
        onError: (rej) => {
          this.llamaSwapDownloadProgress$.set(ErrorDownloadMessage);
          reject(rej);
        },
      });
    });
  }

  downloadRerankerModel(modelConfig: any) {
    return new Promise<void>((resolve, reject) => {
      this.rerankerTransfomersModelDownloadProgress$.set({
        message: '开始下载',
      });

      this.#client.environment.reranker.transfomers.downloadModel.subscribe(
        undefined,
        {
          onData: (value) => {
            this.rerankerTransfomersModelDownloadProgress$.set(value);
          },
          onComplete: () => {
            this.rerankerTransfomersModelDownloadProgress$.set({
              type: 'end',
            });
            resolve();
          },
          onError: (e) => {
            this.rerankerTransfomersModelDownloadProgress$.set({
              type: 'error',
            });
            reject(e);
          },
        },
      );
    });
  }
  downloadQdrant() {
    return new Promise<void>((resolve, reject) => {
      this.qdrantDownloadProgress$.set(StartDownloadMessage);
      this.#client.environment.qdrant.download.subscribe(
        {},
        {
          onData: (value) => {
            this.qdrantDownloadProgress$.set(value);
          },
          onComplete: () => {
            this.#checkUpdate();
            this.qdrantDownloadProgress$.set(EndDownloadMessage);
            resolve();
          },
          onError: (e) => {
            this.qdrantDownloadProgress$.set(ErrorDownloadMessage);
            reject(e);
          },
        },
      );
    });
  }
  llamaNeedUpdate$ = signal(false);
  llamaDisabled$ = signal(false);
  showChannel(name: string) {
    return this.#client.environment.showChannel.query(name);
  }
  changePath(filePath: string) {
    return this.#client.fs.selectFolder.query(filePath ?? '');
  }
  openFolder(filePath: string) {
    return this.#client.fs.openFolder.query(filePath);
  }

  chatTest() {
    return new Promise<void>((resolve, reject) => {
      let lastValue: string | undefined;
      this.qdrantDownloadProgress$.set(StartDownloadMessage);
      this.#client.environment.chat.test.subscribe(undefined, {
        onData: (data) => {
          this.testMessage$.set({ message: data });
          lastValue = data;
        },
        onComplete: () => {
          this.testMessage$.set(EndDownloadMessage);
          resolve();
        },
        onError: reject,
      });
    });
  }

  options = {
    fieldGlobalConfig: FieldGlobalConfig,
    context: this,
    handle: InstallSchemaHandle as any,
  };
  #checkUpdate() {
    this.#client.environment.qdrant.checkUpdate
      .query(undefined)
      .then((value) => {
        this.qdrantUpdate$.set(value);
      });

    this.#client.environment.llamaSwap.checkUpdate
      .query(undefined)
      .then((value) => {
        this.llamaUpdate$.set(value);
      });
  }
  ngOnInit(): void {
    this.#client.environment.llamaSwap.status.subscribe(undefined, {
      onData: (value) => {
        this.llamacppStatus$.set(value);
      },
    });

    this.#client.environment.qdrant.status.subscribe(undefined, {
      onData: (value) => {
        this.qdrantStatus$.set(value);
      },
    });
    this.#checkUpdate();
    this.#client.environment.getConfiguration.query().then((data) => {
      this.model$.set(data);
    });
  }

  modelChange(value: any) {
    this.#client.environment.setConfiguration.query(value);
  }
  toggleEmbedding(value: any) {
    this.#client.environment.toggleEmbedding.query(undefined);
  }
}
