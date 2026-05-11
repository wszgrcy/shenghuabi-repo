import {
  computed,
  inject,
  RootStaticInjectOptions,
  signal,
} from 'static-injector';
import { FolderName, WorkspaceService } from '../workspace.service';
import { InstallStatus } from './type';
import { ExtensionConfig } from '../config.service';

import { path } from '@cyia/vfs2';
import { LogFactoryService } from '../log.service';
import { ImageAdjustType } from '@shenghuabi/knowledge/ocr';
import Tinypool from 'tinypool';
import { getUniqueObjectKey } from '@share/util/uniq-object-key';
import { LRUCache } from 'lru-cache';
import { MessageChannel } from 'worker_threads';
import { StatusService } from '../status.service';
import { defaultsDeep, omitBy } from 'lodash-es';
import { isEmptyInput } from '../../share/util/is-empty-input';
import { createMessage2Log } from '@cyia/dl';
export type ImageInput = string | Uint8Array;
const WORKER_PATH = 'file://' + path.join(__dirname, 'worker/ocr.mjs');

export class OCRService extends RootStaticInjectOptions {
  installStatus$ = signal(InstallStatus.unknown);
  #channel = inject(LogFactoryService).getLog('ocr');
  #workspace = inject(WorkspaceService);
  #pool$ = computed(
    () =>
      new Tinypool({
        filename: WORKER_PATH,
        maxThreads: ExtensionConfig['ocr.options'].threads(),
        concurrentTasksPerWorker: 1,
        runtime: 'worker_threads',
      }),
  );
  readonly #freeCount = 50;
  #status = inject(StatusService).ocr;

  async check() {
    // 直接下载不用二进制
    this.#status.setSuccessMessage(`内置`);
  }
  /** 提示安装 */
  async downloadModel(
    ocrConfig?: { key: string; modelDir: string },
    cb?: (value: any) => void,
  ) {
    clearTimeout(this.#timeoutCleanId);
    ocrConfig ??= {
      key: ExtensionConfig['ocr.options'].mode(),
      modelDir: this.#workspace.dir[FolderName.ocrDir](),
    };
    const key = getUniqueObjectKey(ocrConfig);
    if (this.#cache.has(key)) {
      await this.#cache.get(key)!;
    } else {
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
      const result = this.#pool$().run(
        {
          ...ocrConfig,
          port: port1,
        },
        { name: 'init', transferList: [port1] },
      );
      this.#cache.set(key, result);
      await result;
      port2.close();
    }
  }
  /** 不启动服务,只是调用时使用 */
  async init() {
    this.check();
  }
  #cache = new LRUCache<string, Promise<any>, any>({
    max: 10,
  });
  #count = 0;
  readonly #idleTimeout = 30_000;
  #timeoutCleanId: any;
  async autoConvert(
    filePath: ImageInput,
    ocrConfig?: { key: string; modelDir: string; device?: string },
    options?: ImageAdjustType,
  ) {
    ocrConfig = defaultsDeep(omitBy(ocrConfig, isEmptyInput), {
      key: ExtensionConfig['ocr.options'].mode(),
      modelDir: this.#workspace.dir[FolderName.ocrDir](),
      device: ExtensionConfig['ocr.options'].device(),
    });
    await this.downloadModel(ocrConfig);
    const result = await this.#pool$().run(
      {
        filePath,
        ocrConfig,
        options: options ?? ExtensionConfig['ocr.options'](),
      },
      {
        name: 'convert',
      },
    );
    this.#count++;
    if (process.platform === 'win32') {
      if (this.#freeCount === this.#count) {
        this.#count = 0;
        this.#pool$().recycleWorkers();
      }
    }
    clearTimeout(this.#timeoutCleanId);
    if (process.platform === 'win32') {
      this.#timeoutCleanId = setTimeout(() => {
        this.#count = 0;
        this.#pool$().recycleWorkers();
      }, this.#idleTimeout);
    }
    return result.map((item: any) => item.text).join('\n');
  }
}
