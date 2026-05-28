import { inject } from 'static-injector';
import { NodeRunnerBase, serializeLexicalTextarea } from '@shenghuabi/workflow';
import { WorkspaceService } from '../../../../workspace.service';
import { WorkflowExtraMetadata } from '@shenghuabi/workflow';
import { differenceBy } from 'lodash-es';
import { getNodeType } from '../../../../ai/rag/graph-util';
import { TemplateFormatService } from '@shenghuabi/workflow';
import { NodeItem } from '../../../../ai/rag/type';
import { GRAPH_QUERY_NODE_DEFINE } from '../graph-query.node.define';
import { CustomKnowledgeManagerService } from '../../../../knowledge/custom-knowledge.manager.service';
import { EMPTY_QUERY } from '../../../../knowledge/const';
import { GraphQueryService } from '@shenghuabi/knowledge/knowledge';
import { dynamicInject } from '../../../../../token';

export type WorkflowFileExtraMetadata = WorkflowExtraMetadata;
export class GraphQueryNodeRunner extends NodeRunnerBase<
  typeof GRAPH_QUERY_NODE_DEFINE
> {
  #format = inject(TemplateFormatService);

  #workspace = inject(WorkspaceService);
  #manager$$ = dynamicInject(CustomKnowledgeManagerService);
  override async run() {
    const config = this.inputs!;

    const instance = await this.#manager$$().getGraph(config.name);
    if (!instance) {
      throw new Error(`未找到[${config.name}]知识库`);
    }

    const query = instance.createQuery(EMPTY_QUERY);
    let resultList: Awaited<ReturnType<GraphQueryService['fuzzyQueryNode']>> =
      [];
    if (config.question) {
      const question = serializeLexicalTextarea(config.question, {
        context: await this.nodeContextData$$(),
        environmentContext: this.environmentContextData,
      });
      resultList = await query.fuzzyQueryNode(question, {
        nodeLimit: config.nodeLimit,
        nodeSizeLimit: config.nodeSizeLimit,
        score: config.score,
      });
    }
    if (config.list) {
      const data = await query.queryNode(config.list, {
        nodeSizeLimit: config.nodeSizeLimit,
      });
      for (const item of data) {
        if (!item.payload) {
          continue;
        }
        const name = item.payload['name'] as string;
        const list = resultList.find((item) => item.id === name);

        if (!list) {
          resultList.push({ id: name, hits: [item as any] });
        } else {
          const needAdd = differenceBy([item], list.hits, (item) => item.id);
          list.hits.push(...(needAdd as any));
        }
      }
    }
    const originList = resultList.map(({ id, hits }) => {
      return {
        name: id,
        list: hits.map(({ payload }) => {
          return {
            data: payload as NodeItem,
            edgeList: instance.local.getChunkEdgeByNode(payload as NodeItem),
          };
        }),
      };
    });
    const result2 = originList.map(({ name, list }) => {
      return {
        NODE: {
          name: name,
          type: getNodeType({
            list: list.map(({ data }) => data),
          }),
          description: list.map(({ data }) => data.description).join('\n'),
          fileName: list.map(({ data }) => data.fileName).join('\n'),
          // 对其他参数的处理?
        },
        // 需要一个模板支持
        EDGE_LIST: list.flatMap((item) => item.edgeList),
      };
    });
    return async (id: string) => {
      if (id === 'default' || !id || id === 'tool') {
        return originList;
      } else {
        if (!config.template.enable || !config.template.value) {
          return result2;
        }
        const list = [];
        for (const result of result2) {
          list.push(this.#format.interpolate(config.template.value, result));
        }
        return list;
      }
    };
  }
}
