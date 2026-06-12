import { LlamaSwapService } from '@shenghuabi/llama';
import { effect, inject, Injector } from 'static-injector';
import * as vscode from 'vscode';
import { ExtensionConfig } from '../config.service';
import { StatusService } from '../status.service';
import { TTSSerivce } from '@shenghuabi/python-addon';
import {
  QdrantServerService,
  QdrantStartToken,
} from '@shenghuabi/knowledge/qdrant';
import { OpenAI } from 'openai';
import { ModelConfigInputType } from '@shenghuabi/openai';
import { ChatService } from '../ai/chat.service';

export class LlamaSwapBridgeService {
  #llamaSwap = inject(LlamaSwapService);
  #injector = inject(Injector);
  #status = inject(StatusService);
  #qdServer = inject(QdrantServerService);
  #chat = inject(ChatService);
  init() {
    // 配置变更同步到llamaswap文件中
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      const result = e.affectsConfiguration(`shenghuabi.llama.config`);
      if (result) {
        await this.#llamaSwap.checkExist();
      }
      if (result && this.#llamaSwap.exist$()) {
        vscode.window.withProgress(
          {
            title: 'llama配置同步中',
            location: vscode.ProgressLocation.Notification,
          },
          async (progress) => {
            const server = ExtensionConfig['llama.config'].server();
            const swap = ExtensionConfig['llama.config'].swap();
            await this.#llamaSwap.writeConfig({
              server,
              swap,
            });
            setTimeout(() => {
              this.#updateLlmList();
            }, 2000);
          },
        );
      }
    });
    effect(
      () => {
        const start = this.#llamaSwap.start$();
        const exist = this.#llamaSwap.exist$();
        if (start) {
          this.#status.llamacpp.setSuccessMessage('运行中');
        } else if (exist) {
          this.#status.llamacpp.setSuccessMessage('已安装');
        } else {
          this.#status.llamacpp.setSuccessMessage('未知');
          this.#chat.llamaSwapModelList$.set([]);
        }
      },
      { injector: this.#injector },
    );
    this.#injector.get(TTSSerivce).start$.subscribe((value) => {
      if (value === 1) {
        this.#status.pythonAddon.setSuccessMessage('运行中');
      } else {
        this.#status.pythonAddon.setSuccessMessage('已停止');
      }
    });

    effect(
      () => {
        const start = this.#qdServer.start$();
        const exist = this.#qdServer.exist$();
        if (start) {
          this.#injector.get(QdrantStartToken).resolve();
          this.#status.qdrant.setSuccessMessage('运行中');
          this.#updateLlmList();
        } else if (exist) {
          this.#status.qdrant.setSuccessMessage('已安装');
        } else {
          this.#status.qdrant.setSuccessMessage('未知');
        }
      },
      { injector: this.#injector },
    );
  }

  #updateLlmList() {
    const url = `http://${ExtensionConfig['llama.listen']()}/v1`;
    const openai = new OpenAI({
      baseURL: url,
      apiKey: ' ',
    });
    openai.models.list().then((page) => {
      const llamaList = page.data.map((item) => {
        return {
          apiKey: ' ',
          model: item.id,
          name: `llama/${item.id}`,
          provider: 'openai-completions',
          config: {
            baseUrl: url,
          },
        } satisfies ModelConfigInputType;
      });
      this.#chat.llamaSwapModelList$.set(llamaList);
    });
  }
}
