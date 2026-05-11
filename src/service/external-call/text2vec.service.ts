import {
  Injector,
  RootStaticInjectOptions,
  computed,
  createInjector,
  inject,
  signal,
} from 'static-injector';
import { ExtensionConfig } from '../config.service';
import { InstallStatus, RunningStatus } from './type';
import { TransformersEmbeddingService } from './embedding/transformers-embedding.service';
import { EmbeddingBase } from './embedding/embedding.service';
import { OpenAIEmbeddingService } from './embedding/openai-embedding.service';
import { StatusService } from '../status.service';
import {
  EMBEDDING_OPTIONS_TOKEN,
  EmbeddingModelOptions,
} from './embedding/type';
import { LRUCache } from 'lru-cache';
import { getUniqueObjectKey } from '../../util/uniq-object-key';
import {
  EmbeddingConfig,
  EmbeddingConfigToken,
  EmbeddingService,
} from '@shenghuabi/knowledge/embedding';
import { IdleClean } from '../../class/idle';
const EmbeddingObj = {
  transformers: TransformersEmbeddingService,
  openai: OpenAIEmbeddingService,
};
export class Text2VecService extends RootStaticInjectOptions {
  #cache = new LRUCache<string, EmbeddingBase, EmbeddingModelOptions>({
    max: 5,
    dispose: (value, key) => {
      return value.destroy();
    },
  });

  installStatus$ = signal(InstallStatus.unknown);
  runningStatus$ = signal(RunningStatus.unknown);

  /** 默认的服务 */
  #runningService?: EmbeddingBase;
  type?: string;
  #status = inject(StatusService).text2vec;
  #injector = inject(Injector);

  #initDefault = computed(() => {
    const modelConfig = ExtensionConfig.text2vec()!;
    this.#runningService = this.#create({
      type: modelConfig.startupType,
      baseURL: modelConfig.baseURL,
      dtype: modelConfig.dtype,
      device: modelConfig.device,
      size: modelConfig.embeddingLength,
      model: modelConfig.modelName,
    });
    this.type = modelConfig.startupType;
  });

  check() {
    this.#status.setSuccessMessage(`内置`);
  }
  async init() {
    this.check();
    this.#initDefault();
  }
  #create(options: Partial<EmbeddingModelOptions>) {
    const key = getUniqueObjectKey(options);
    if (this.#cache.has(key)) {
      return this.#cache.get(key)!;
    }

    const EmbeddingType = EmbeddingObj[options.type!];
    const injector = createInjector({
      providers: [
        EmbeddingType,
        { provide: EMBEDDING_OPTIONS_TOKEN, useValue: options },
      ],
      parent: this.#injector,
    });
    const instance = injector.get(
      EmbeddingType as any as typeof TransformersEmbeddingService,
    );
    instance.init();
    const injector2 = createInjector({
      providers: [
        EmbeddingService,
        {
          provide: EmbeddingConfigToken,
          useValue: {
            maxCache: 100,
            ttl: 30_000,
            maxBatchSize: ExtensionConfig.text2vec.maxBatchSize(),
            maxAsyncCount: ExtensionConfig.text2vec.maxAsyncCount(),
            text2Vec: (list) => instance.extractor(list),
          } as EmbeddingConfig,
        },
      ],
      parent: injector,
    });
    const idle = new IdleClean(() => {
      // todo 实例会被引用
      // this.#cache.delete(key);
      instance?.clean?.();
    }, 30_000);
    const embeddingService = injector2.get(EmbeddingService);
    const output = {
      init() {},
      // 目前貌似没法自动销毁
      destroy() {
        return instance.destroy();
      },
      getSize: async () => {
        idle.stop();
        const result = await instance.getSize();
        idle.restart();
        return result;
      },
      extractor: (value) => {
        idle.stop();
        const result = embeddingService.text2Vec(value);
        idle.restart();
        return result;
      },
    } as EmbeddingBase;
    if (options.type === 'transformers') {
      (output as any).download = (...args: any[]) => {
        return (instance.download as any)(...args);
      };
    }
    this.#cache.set(key, output);
    return output;
  }
  async get(options?: Partial<EmbeddingModelOptions>) {
    return this.#create({
      ...this.#getDefaultOptions(),
      ...(options ?? (await this.getOptions())),
    });
  }
  async reSet() {
    const type = ExtensionConfig.text2vec.startupType();
    if (this.type !== type) {
      await this.#runningService?.destroy();
    } else {
      return;
    }
    this.type = undefined;
    this.#runningService = undefined;
    this.init();
  }

  async getSize(): Promise<number> {
    this.#initDefault();
    return this.#runningService?.getSize() as any;
  }
  #getDefaultOptions() {
    return {
      model: ExtensionConfig.text2vec.modelName(),
      type: ExtensionConfig.text2vec.startupType(),
      baseURL: ExtensionConfig.text2vec.baseURL(),
      dtype: ExtensionConfig.text2vec.dtype(),
      device: ExtensionConfig.text2vec.device(),
    } as EmbeddingModelOptions;
  }
  async getOptions() {
    return {
      model: ExtensionConfig.text2vec.modelName(),
      size: await this.getSize(),
      type: ExtensionConfig.text2vec.startupType(),
      baseURL: ExtensionConfig.text2vec.baseURL(),
      dtype: ExtensionConfig.text2vec.dtype(),
      device: ExtensionConfig.text2vec.device(),
    } as EmbeddingModelOptions;
  }
}
