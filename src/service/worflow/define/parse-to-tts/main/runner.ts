import { inject, Injector } from 'static-injector';

import { NodeRunnerBase, serializeLexicalTextarea } from '@shenghuabi/workflow';

import { TTSSerivce } from '@shenghuabi/python-addon';
import { PARSE_TO_TTS_DEFINE } from '../node.define';
export class Runner extends NodeRunnerBase<typeof PARSE_TO_TTS_DEFINE> {
  #injector = inject(Injector);

  override async run() {
    const config = this.inputs;
    // 跟全局一样
    const { filePath, content } = config;
    const ttsSerivce = this.#injector.get(TTSSerivce);
    const pFilePath = serializeLexicalTextarea(filePath, {
      context: await this.nodeContextData$$(),
      environmentContext: this.environmentContextData,
    });
    const isSrt = pFilePath.endsWith('.srt') || pFilePath.endsWith('.vtt');
    const pContent = serializeLexicalTextarea(content, {
      context: await this.nodeContextData$$(),
      environmentContext: this.environmentContextData,
    });
    const queue = isSrt
      ? await ttsSerivce.getSrtScript(
          {
            filePath: pFilePath,
            content: pContent,
          },
          undefined,
          {},
        )
      : await ttsSerivce.getTextScript(
          {
            filePath: pFilePath,
            content: pContent,
          },
          undefined,
          {},
        );
    return async (id: string) => {
      switch (id) {
        default:
          return queue.getConfig() as any;
      }
    };
  }
}
