import { Injector, computed, effect, inject } from 'static-injector';
import { ExtensionConfig } from '../../config.service';
import { WorkspaceService, FolderName } from '../../workspace.service';
import { Message } from '../type';
import { EmbeddingBase } from './embedding.service';
import {
  EMBEDDING_OPTIONS_TOKEN,
  EmbeddingModelOptions,
  ExtractorFn,
} from './type';
// import { WebGpuBrowserWindowService } from '../../../native';
import { MessageChannel } from 'worker_threads';

import { path } from '@cyia/vfs2';

import { errorFormatByNode } from '@share/util/format/error-format-node';
import { LogFactoryService } from '../../log.service';
import Tinypool from 'tinypool';
import { createMessage2Log } from '@cyia/dl';
import { HUGGINGFACE_URL_TOKEN } from '@cyia/external-call';

// 20.18.2 修复了一个bug导致的bug
const WORKER_PATH = 'file://' + path.join(__dirname, 'worker/text2vec.mjs');

export class TransformersEmbeddingService implements EmbeddingBase {
  #channel = inject(LogFactoryService).getLog('text2vec');
  #workspace = inject(WorkspaceService);
  #options = inject(EMBEDDING_OPTIONS_TOKEN);
  /** worker */
  #pool$ = computed(
    () =>
      new Tinypool({
        filename: WORKER_PATH,
        maxThreads: ExtensionConfig.text2vec.threads(),
        concurrentTasksPerWorker: 2,
        runtime: 'worker_threads',
      }),
  );
  #startStatus?: Promise<boolean> = undefined;
  #inited = false;
  #fn$ = Promise.withResolvers<ExtractorFn>();
  #injector = inject(Injector);
  #hgModelHost = inject(HUGGINGFACE_URL_TOKEN);
  extractor<T extends string | string[]>(value: T) {
    return this.#fn$.promise.then((fn) => fn(value));
  }
  clean() {
    if (process.platform === 'win32') {
      if (this.#startStatus) {
        this.#pool$().recycleWorkers();
        this.#startStatus = undefined;
      }
    }
  }
  async init() {
    if (!this.#inited) {
      this.#inited = true;
      effect(
        () => {
          ExtensionConfig.text2vec.device();
          ExtensionConfig.text2vec.dtype();
          this.#startStatus = undefined;
        },
        { injector: this.#injector },
      );
    }
    this.#fn$.resolve(async (value: string | string[]) => {
      await this.#initModel();
      return this.#extractor(value);
    });
  }
  #mode = this.#options.model.toLowerCase().includes('qwen3')
    ? 'qwen3'
    : undefined;
  async #initModel(force?: boolean, cb?: (data: string) => void) {
    if (force) {
      this.#startStatus = undefined;
    }

    const device = this.#options.device!;
    if (!this.#startStatus) {
      this.#channel.info(
        `[embedding]初始化...设备: ${device},模型: ${this.#options.model},类型: ${this.#options.dtype}`,
      );
      const { port1, port2 } = new MessageChannel();
      const progressLog = createMessage2Log();
      port2.on('message', (value) => {
        if (value.type === 'progress') {
          const result = progressLog(value.message);
          if (result) {
            this.#channel.info(result.message);
            cb?.(result.message);
          }
        }
      });
      this.#startStatus = this.#pool$()
        .run(
          {
            dir: this.#workspace.dir[FolderName.text2vecDir](),
            modelName: this.#options.model,
            options: {
              dtype: this.#options.dtype,
              device: device,
            },
            remoteHost: this.#hgModelHost(),
            port: port1,
            mode: this.#mode,
            hfToken: ExtensionConfig.hfToken(),
          },
          { name: 'init', transferList: [port1] },
        )
        .catch((rej) => {
          const str = `使用transformers加载模型[${this.#options.model}:${this.#options.device ?? ''}:${this.#options.dtype ?? ''}]失败\n${errorFormatByNode(rej)}`;
          this.#channel.failed(str);
          throw new Error(`${str}`, { cause: rej });
        })
        .finally(() => {
          port1.close();
        });
    }
    return this.#startStatus;
  }

  // 多次请求时,出现异常应该多失败,这样的话可能会同时初始化?
  async #extractor(value: string | string[]) {
    const device = this.#options.device!;
    return this.#pool$().run(
      {
        value: value,
        dir: this.#workspace.dir[FolderName.text2vecDir](),
        modelName: this.#options.model,
        options: {
          dtype: this.#options.dtype,
          device: device,
        },
        remoteHost: this.#hgModelHost(),
        mode: this.#mode,
        hfToken: ExtensionConfig.hfToken(),
      },
      { name: 'convert' },
    );
  }
  async getSize() {
    const result = await this.#initModel();
    if (!result) {
      this.#channel.failed('模型加载失败');
      throw new Error('模型加载失败');
    }
    return this.#pool$().run({}, { name: 'getSize' });
  }
  async download(dir: string, modelName: string, cb: (data: string) => void) {
    this.#channel.info(`准备下载模型,文件夹:${dir},模型:${modelName}`);
    const result = await this.#initModel(true, cb);
    this.#channel.info(result ? '模型下载成功' : '模型下载失败');
    if (result) {
      this.#fn$.resolve(async (value: string | string[]) => {
        await this.#initModel();
        return this.#extractor(value);
      });
    }
    this.#channel.info(result ? Message.installed : Message.failed);

    return !!result;
  }

  async destroy(): Promise<any> {
    if (this.#startStatus) {
      return this.#pool$().destroy();
    }
  }
  async getOptions(): Promise<EmbeddingModelOptions> {
    return {
      ...this.#options,
      size: await this.getSize(),
    };
  }
}
