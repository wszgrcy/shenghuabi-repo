import { inject, Injector, RootStaticInjectOptions } from 'static-injector';
import { openFolder } from '../../webview/tree/folder.tree';
import { FolderName, WorkspaceService } from '../workspace.service';
import { ChannelService } from '../channel.service';
import { LlamaSwapService } from '@shenghuabi/llama';
import { TTSSerivce } from '@shenghuabi/python-addon';
export interface ExternalCallOptions {
  name: string;
  method: string;
  args: any[];
}
export class ExternalCallService extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);
  #channel = inject(ChannelService);
  #injector = inject(Injector);
  async call(input: ExternalCallOptions) {
    if (input.name === 'llama.cpp') {
      if (input.method === 'openDir') {
        openFolder(this.#workspace.dir[FolderName.llamaDir]());
      } else if (input.method === 'start') {
        this.#injector.get(LlamaSwapService).init();
      } else if (input.method === 'stop') {
        this.#injector.get(LlamaSwapService).stop();
      }
    } else if (input.name === 'pythonAddon') {
      if (input.method === 'openDir') {
        openFolder(this.#workspace.dir[FolderName.pythonAddon]());
      } else if (input.method === 'stop') {
        this.#injector.get(TTSSerivce).stop();
      } else if (input.method === 'clearChunk') {
        this.#injector.get(TTSSerivce).clearChunk();
      }
    } else if (input.name === 'qdrant') {
      switch (input.method) {
        case 'openDir':
          openFolder(this.#workspace.dir[FolderName.qdrantDir]());
          break;

        default:
          break;
      }
    } else if (input.name === 'text2vec') {
      switch (input.method) {
        case 'openModelDir':
          openFolder(this.#workspace.dir[FolderName.text2vecDir]());
          break;

        default:
          break;
      }
    } else if (input.name === 'ocr') {
      switch (input.method) {
        case 'openDir':
          openFolder(this.#workspace.dir[FolderName.ocrDir]());
          break;

        default:
          break;
      }
    } else if (input.name === 'knowledge') {
      switch (input.method) {
        case 'channel':
          this.#channel.show('knowledge');
          break;

        default:
          break;
      }
    }
  }
}
