import { NodeRunnerBase } from '@shenghuabi/workflow';
import { ChatContextType } from '../../../../../share';
import { ChatMetadata } from '../../../../ai/knowledge-base/type';
import { WorkflowExtraMetadata } from '@shenghuabi/workflow';
import { IMAGE_NODE_DEFINE } from '../image.node.define';
import * as v from 'valibot';
import {
  bufferToImageBase64,
  convertToCompatibleBuffer,
} from '@shenghuabi/knowledge/image';
export class ImageRunner extends NodeRunnerBase {
  //todo 列表 出口 加个单一?
  override async run() {
    const nodeResult = v.parse(IMAGE_NODE_DEFINE, this.node);

    const list = nodeResult.data.value;
    const newList: any[] = [];
    const extraList: ChatMetadata[] = [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const imageResult = await convertToCompatibleBuffer(item);
      if (!imageResult.type) {
        continue;
      }
      // 目前只有一个格式
      newList.push({
        type: 'image_url',
        data: bufferToImageBase64(imageResult),
      });
      extraList.push({
        type: ChatContextType.image,
        description: item,
        tooltip: `格式: ${imageResult.type}`,
      });
    }
    return async () => {
      return {
        value: newList,
        extra: extraList.map((item) => ({
          metadata: item,
        })) as WorkflowExtraMetadata[],
      };
    };
  }
}
