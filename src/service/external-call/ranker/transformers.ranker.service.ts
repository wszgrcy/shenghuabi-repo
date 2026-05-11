import { computed, inject } from 'static-injector';
import { ReRanker_OPTIONS_TOKEN } from './type';
import { path } from '@cyia/vfs2';
import Tinypool from 'tinypool';
import { FolderName, WorkspaceService } from '../../workspace.service';
import { createMessage2Log } from '@cyia/dl';
import { LogFactoryService } from '../../log.service';
import { MessageChannel } from 'worker_threads';
import { HUGGINGFACE_URL_TOKEN } from '@cyia/external-call';

const WORKER_PATH = 'file://' + path.join(__dirname, 'worker/reranker.mjs');

export class TransformersReRankerService {
  #channel = inject(LogFactoryService).getLog('text2vec');

  inited$$?: Promise<void>;
  options = inject(ReRanker_OPTIONS_TOKEN);
  #workspace = inject(WorkspaceService);
  #hgModelHost = inject(HUGGINGFACE_URL_TOKEN);
  #pool$ = computed(
    () =>
      new Tinypool({
        filename: WORKER_PATH,
        maxThreads: 1,
        concurrentTasksPerWorker: 2,
        runtime: 'worker_threads',
      }),
  );
  async #initModel(fn?: (data: string) => void) {
    if (!this.inited$$) {
      this.#channel.info(
        `[reranker]初始化...设备: ${this.options.device},模型: ${this.options.modelName},类型: ${this.options.dtype}`,
      );
      const { port1, port2 } = new MessageChannel();

      const input = {
        dir: this.#workspace.dir[FolderName.reRankerDir](),
        modelName: this.options.modelName,
        options: {
          device: this.options.device,
          dtype: this.options.dtype,
        },
        remoteHost: this.#hgModelHost(),
      };
      if (fn) {
        (input as any).port = port1;
      }
      this.inited$$ = this.#pool$().run(input, {
        name: 'init',
        transferList: fn ? [port1] : undefined,
      });
      if (fn) {
        const progressLog = createMessage2Log();
        port2.on('message', (value: any) => {
          if (value.type === 'progress') {
            const result = progressLog(value.message);
            if (result) {
              this.#channel.info(result.message);
              fn?.(result.message);
            }
          }
        });
      }
    }
    await this.inited$$;
  }
  async run(input: any) {
    await this.#initModel();
    const result = await this.#pool$().run(input, { name: 'convert' });
    return result;
  }
  async download(cb: (data: string) => void) {
    this.inited$$ = undefined;
    await this.#initModel(cb);
  }
  destroy() {
    if (this.inited$$) {
      this.#pool$().destroy();
    }
  }
}
