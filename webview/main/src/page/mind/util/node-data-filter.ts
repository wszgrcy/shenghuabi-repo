import {
  CardEditorDefine,
  NodeCommonDefine,
  NodeDataType,
} from '@bridge/share';
import { cloneDeep } from 'lodash-es';
import * as v from 'valibot';
/**
 * todo 和 config-format 统一文件.因为一个是输入.一个是输出  */
export function nodeDataFilter(node: { data: NodeDataType; type: string }) {
  const originData = cloneDeep(node.data);
  delete originData['layout'];
  delete originData['style'];
  delete originData['edge'];
  delete originData['config'];

  if (node.type === 'chat' || node.type === 'card') {
    return {
      ...v.parse(
        v.object({
          ...NodeCommonDefine.entries,
          editor: v.optional(CardEditorDefine),
        }),
        node.data,
      ),
      ...originData,
    };
  } else {
    delete (originData as any)['editor'];
  }
  return { ...v.parse(NodeCommonDefine, node.data), ...originData };
}
