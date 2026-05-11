import { inject } from 'static-injector';

import { TemplateFormatService } from '@shenghuabi/workflow';
import { NodeRunnerBase } from '@shenghuabi/workflow';

import { TEXT_TO_AUDIO_DEFINE } from '../text-to-audio.node.define';
import { TTSSerivce } from '@shenghuabi/python-addon';
import { FolderName, WorkspaceService } from '../../../../workspace.service';
import { path } from '@cyia/vfs2';
import { getFileTimestamp } from '@cyia/util';
export class TextToAuduioRunner extends NodeRunnerBase {
  #ttsSerivce = inject(TTSSerivce);
  #workspace = inject(WorkspaceService);
  #format = inject(TemplateFormatService);

  override async run() {
    const nodeResult = this.getParsedNode(TEXT_TO_AUDIO_DEFINE);
    return async (outputName: string) => {
      const outputPath = path.join(
        this.#workspace.dir[FolderName.pythonAddon](),
        'chunk',
        'workflow',
        getFileTimestamp() + '.wav',
      );
      // todo 暂时未实现
      // await this.#ttsSerivce.text2speechItem(
      //   nodeResult.data.config.reference as any,
      //   this.#format.interpolate(
      //     nodeResult.data.value,
      //     this.inputValueObject$$(),
      //   ),
      //   outputPath,
      //   { backend: ExtensionConfig.tts.backend() as any },
      //   ExtensionConfig.indexTTS(),
      // );
      switch (outputName) {
        default:
          return {
            value: outputPath,
            extra: {
              format: 'audio',
            },
          };
      }
    };
  }
}
