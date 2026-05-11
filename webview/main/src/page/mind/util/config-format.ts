import { MindNode, NodeDataType } from '@bridge/share';
import { commonConfig } from '@fe/util/common-config';
/** 找相同配置 */
export function configFormat(list: MindNode[]) {
  const editorSupport = list.every(
    (item) => item.type === 'card' || item.type === 'chat',
  );
  const result = commonConfig(list.map((item) => item.data)) as NodeDataType;
  const config = {
    layout: result?.layout,
    style: result?.style,
    editor: (result as any)?.['editor'],
    edge: result?.edge,
    config: result?.config,
  };
  if (!editorSupport) {
    if ('editor' in config) {
      delete (config as any)['editor'];
    }
  }
  return config;
}
