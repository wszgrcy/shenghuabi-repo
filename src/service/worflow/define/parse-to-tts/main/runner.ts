import { inject, Injector } from 'static-injector';

import { NodeRunnerBase } from '@shenghuabi/workflow';

import { TTSSerivce } from '@shenghuabi/python-addon';
import * as v from 'valibot';
import { PARSE_TO_TTS_DEFINE } from '../node.define';
import { TemplateFormatService } from '@shenghuabi/workflow';
export class Runner extends NodeRunnerBase {
  #injector = inject(Injector);
  #format = inject(TemplateFormatService);

  override async run() {
    const nodeResult = v.parse(PARSE_TO_TTS_DEFINE, this.node);
    const obj = this.inputValueObject$$();
    // 跟全局一样
    const { filePath, content } = nodeResult.data;
    const ttsSerivce = this.#injector.get(TTSSerivce);
    const pFilePath = this.#format.interpolate(filePath, obj);
    const isSrt = pFilePath.endsWith('.srt') || pFilePath.endsWith('.vtt');
    const queue = isSrt
      ? await ttsSerivce.getSrtScript(
          {
            filePath: pFilePath,
            content: this.#format.interpolate(content, obj),
          },
          undefined,
          {},
        )
      : await ttsSerivce.getTextScript(
          {
            filePath: pFilePath,
            content: this.#format.interpolate(content, obj),
          },
          undefined,
          {},
        );
    return async (outputName: string) => {
      switch (outputName) {
        default:
          return {
            value: queue.getConfig() as any,
            extra: {},
          };
      }
    };
  }
}
