import { LlamaSwapService } from '@shenghuabi/llama';
import { inject, Injector } from 'static-injector';
import { ExtensionConfig } from './config.service';
/** 控制llm的启动和停止 */
export class LLMLauncherService {
  #injector = inject(Injector);
  async start() {
    if (ExtensionConfig['llama.startup']()) {
      await this.#injector.get(LlamaSwapService).startup();
    }
  }
  async stop() {
    try {
      await this.#injector.get(LlamaSwapService).stop();
    } catch (error) {}
    //既然停止,那么还需要自动启动,也就是对话的时候还需要启动
  }
}
