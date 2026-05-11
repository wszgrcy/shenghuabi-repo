import { inject } from 'static-injector';

import { NodeRunnerBase } from '@shenghuabi/workflow';
import { WorkspaceService } from '../../../../workspace.service';

import { ChatContextType } from '../../../../../share';
import { WorkflowExtraMetadata } from '@shenghuabi/workflow';
import { MindService } from '../../../../mind/mind.service';
import { html2Text } from '../../../../../util/html-to-text';
import { OCRService } from '../../../../external-call/ocr.service';
import { MindFileService } from '../../../../mind/mind-file.service';
import * as v from 'valibot';
import { CARD_NODE_DEFINE } from '../card.node.define';

export type WorkflowFileExtraMetadata = WorkflowExtraMetadata;
export class CardRunner extends NodeRunnerBase {
  #workspace = inject(WorkspaceService);
  #fileService = inject(MindFileService);
  override async run() {
    const nodeResult = v.parse(CARD_NODE_DEFINE, this.node);
    const list = nodeResult.data.value;
    const mindService = this.injector.get(MindService);
    const ocrService = this.injector.get(OCRService);
    const config = nodeResult.data.config!;

    const newList: string[] = [];
    const extraList: WorkflowFileExtraMetadata[] = [];
    const obj = mindService.cardObject$$();
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const cardItem = obj[item.value];
      const [fileId] = item.value.split('/');
      const html = cardItem.data.value?.html;
      const flowFile = this.#fileService.getFile(cardItem.filePath);
      if (!html) {
        continue;
      }
      const text = await html2Text(html, {
        useOcr: config.useOcr,
        ocrFn: async (filePath) =>
          ocrService
            .autoConvert(
              filePath.startsWith(`data:image/`)
                ? filePath
                : (await flowFile.readImageBuffer(filePath))!,
            )
            .then((res) => res ?? '')
            .catch(() => ''),
      });
      newList.push(text);
      extraList.push({
        metadata: {
          type: ChatContextType.card,
          description: cardItem.data.title || '',
          tooltip: text,
          reference: {
            type: 'card',
            fileName: cardItem.filePath,
          },
        },
      });
    }

    return async (outputName: string) => {
      return {
        value: newList,
        extra: extraList,
      };
    };
  }
}
