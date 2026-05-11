import { inject, RootStaticInjectOptions } from 'static-injector';
import * as v from 'valibot';
import { sortBy } from 'lodash-es';
import { formatContext } from './util/format-context';
import { ChatContextType } from '../../../share';
import { ChatMetadata } from '../knowledge-base/type';
import { CustomKnowledgeManagerService } from '../../knowledge/custom-knowledge.manager.service';
import { WorkflowExecService } from '@shenghuabi/workflow';
import { WorkflowSelectService } from '@shenghuabi/workflow';
import { errorFormatByNode } from '@share/util/format/error-format-node';
import { Observer } from '@trpc/server/observable';
import { WorkflowEmitter } from '@shenghuabi/workflow';
import { dynamicInject } from '../../../token';
import { RAG_NODE_DEFINE } from '../../worflow/define/rag/rag.node.define';

export class Rag2Class extends RootStaticInjectOptions {
  #manager$$ = dynamicInject(CustomKnowledgeManagerService);

  async query(
    searchContent: string,
    queryParams: v.InferOutput<typeof RAG_NODE_DEFINE>['data']['config'],
    emitter: WorkflowEmitter,
    signal?: AbortSignal,
  ) {
    const graph = await this.#manager$$().getGraph(queryParams.name);
    const query = graph.createQuery(queryParams);
    let queryContent;
    if (queryParams.disableKeywordExtract) {
      queryContent = searchContent;
    } else {
      const result = await this.#createWorkflow(
        queryParams.workflow.extractKeyword,
        { question: searchContent },
        emitter.getObserver(),
        signal,
      );

      // this.#channel().info(JSON.stringify(chatResult));
      if (!result || (!result.nodes && !result.edges)) {
        const newError = new Error(
          `关键词提取失败,返回: ${errorFormatByNode(result)}`,
        );
        delete newError.stack;
        throw newError;
      }
      queryContent = result;
    }
    let queryContext;
    if (queryParams.mode === 'local') {
      queryContext = await query.query(
        typeof queryContent === 'string'
          ? { node: queryContent }
          : { node: queryContent!.nodes.join(',') },
        searchContent,
      );
    } else if (queryParams.mode === 'global') {
      queryContext = await query.query(
        typeof queryContent === 'string'
          ? { edge: queryContent }
          : { edge: queryContent!.edges.join(',') },
        searchContent,
      );
    } else {
      queryContext = await query.query(
        typeof queryContent === 'string'
          ? { edge: queryContent, node: queryContent }
          : {
              edge: queryContent!.edges.join(','),
              node: queryContent!.nodes.join(','),
            },
        searchContent,
      );
    }
    // 准备查询
    const contextTable = formatContext({
      nodes: sortBy(queryContext.nodes, (item) => -item.degree),
      edges: sortBy(queryContext.edges, (item) => -item.degree),
      chunks: queryContext.chunks,
    });
    const result = await this.#createWorkflow(
      queryParams.workflow.ragResponse,
      {
        ...contextTable,
        context: queryContext,
        question: searchContent,
      },
      emitter.getObserver(),
      signal,
    );

    return {
      response: result,
      metadata: queryContext.chunks
        .map((item) => {
          return {
            type: ChatContextType.knowledge as string,
            description: item.fileName,
            tooltip: item.chunk,
            reference: {
              type: 'knowledge',
              fileName: item.fileName,
              loc: item.loc,
              knowledgeName: queryParams.name,
            },
          } as ChatMetadata;
        })
        .concat(
          queryContext.nodes.map((item) => {
            return {
              type: '实体',
              description: item.list[0].name,
              tooltip: item.list.map((item) => item.description).join('\n'),
            };
          }),
        )
        .concat(
          queryContext.edges.map((item) => {
            return {
              type: '联系',
              description: item.list[0].name,
              tooltip: item.list.map((item) => item.description).join('\n'),
            };
          }),
        ),
    };
  }
  #workflowExec = inject(WorkflowExecService);
  #workflow = inject(WorkflowSelectService);
  async #createWorkflow(
    fileName: string,
    inputs: Record<string, any>,
    ob?: Observer<any, any>,
    signal?: AbortSignal,
  ) {
    const workflowData = await this.#workflow
      .get({ workflowName: fileName })
      .then(async (data) => {
        const result = this.#workflowExec.parse(data);
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result.data!;
      });
    const result = await this.#workflowExec.runParse(
      workflowData,
      {
        input: {},
        environmentParameters: inputs,
      },
      ob,
      signal,
    );
    return result.value;
  }
}
