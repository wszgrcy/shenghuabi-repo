import { Injectable, inject } from '@angular/core';
import { BridgeService } from '../../service';
import { getConnectedEdges } from '@xyflow/react';
import { TrpcService } from '@fe/trpc';
import { ChatService } from '@fe/component/chat/chat.service';
import { CustomNode } from '../type';
import { nodeContentToString } from '../../util/node-content-to-string';
import { ChatMindNode, flatFilterHandleList } from '@bridge/share';
@Injectable()
export class MindChatProviderService extends ChatService {
  // 节点连接去掉了，改成自动获取
  #bridge = inject(BridgeService);
  #client = inject(TrpcService).client;
  /** 输入参数合并使用 */
  nodeId!: string;

  formatNode(nodeIdList: string[]) {
    const nodes = nodeIdList
      .map((item) => this.#bridge.nodes$().find((q) => q.id === item))
      .filter(Boolean) as CustomNode[];
    const a = nodes.map((item) => {
      if (item.type === 'card') {
        return (
          (item.data['title'] || '') +
          '\n' +
          (nodeContentToString(item) || item.data.value?.markdown || '')
        ).trim();
      } else {
        return '';
      }
    });
    return a.join('\n').trim();
  }

  override mergeInputParams(obj: any) {
    const node = this.#bridge.instance()!.getNode(this.nodeId)! as ChatMindNode;
    const edges = getConnectedEdges([node], this.#bridge.edges());
    const inputHandle = flatFilterHandleList(node.data.handle?.input as any);
    /** 外部节点输入 */
    const inputObject = {} as Record<string, any>;
    for (const inputItem of inputHandle) {
      const linkedEdges = edges.filter(
        (item) => item.targetHandle === inputItem.id,
      );
      if (linkedEdges.length) {
        inputObject[inputItem.value] = this.formatNode(
          linkedEdges.map((item) => item.source),
        );
      }
    }
    return { ...obj, ...inputObject };
  }
}
