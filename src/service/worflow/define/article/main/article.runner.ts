import { inject } from 'static-injector';

import { NodeRunnerBase } from '@shenghuabi/workflow';
import { WorkspaceService } from '../../../../workspace.service';

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChatContextType } from '../../../../../share';
import { minChunkOverlap, separators } from '../../../../vector-query/const';
import { chunk } from 'lodash-es';
import { WorkflowExtraMetadata } from '@shenghuabi/workflow';
import * as v from 'valibot';
import { ARTICLE_NODE_DEFINE } from '../article.define';

export interface ArticleChunk {
  content: string;
  metadata: {
    type: string;
    filePath: string[];
  };
}
export class ArticleRunner extends NodeRunnerBase {
  /** 读取当前的文章 */
  #vfs = inject(WorkspaceService).vfs;
  override async run() {
    const nodeResult = v.parse(ARTICLE_NODE_DEFINE, this.node);
    const list = nodeResult.data.value;
    const newList: { filePath: string; content: string }[] = [];
    for (const filePath of list) {
      const content = await this.#vfs.readContent(filePath);
      if (content) {
        newList.push({ filePath, content });
      }
    }

    const config = nodeResult.data.config!;
    const step = config.step;
    const fileGroup = step === 0 ? [newList] : chunk(newList, step);

    const fileChunkList: ArticleChunk[] | ArticleChunk[][] = [];
    if (config.mode === 'chunk') {
      config.chunkSize ||= 1000;
      for (const fileList of fileGroup) {
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: config.chunkSize,
          chunkOverlap: minChunkOverlap(config.chunkSize),
          separators: separators,
          keepSeparator: false,
        });
        const result = await textSplitter.createDocuments(
          fileList.map(({ content }) => content),
          fileList.map(({ filePath }) => ({
            filePath,
          })),
        );
        if (!result.length) {
          continue;
        }
        (fileChunkList as ArticleChunk[][]).push(
          result.map((item) => {
            return {
              metadata: {
                filePath: [item.metadata['filePath']],
                type: ChatContextType.article,
              },
              content: item.pageContent,
            };
          }),
        );
      }
    } else {
      (fileChunkList as ArticleChunk[]).push(
        ...fileGroup.map((fileList) => {
          return fileList.reduce(
            (obj, item) => {
              obj.content += item.content + '\n';
              obj.metadata.filePath.push(item.filePath);
              return obj;
            },
            {
              content: '',
              metadata: {
                filePath: [] as string[],
                type: ChatContextType.article,
              },
            },
          );
        }),
      );
    }

    // 没有切片的是一维数组，有切片的是二位
    // fixme 可以改reduce优化下
    return async (outputName: string) => {
      if (outputName === 'flat') {
        const flatList = fileChunkList.flat();
        return flatList.reduce(
          (obj, item) => {
            obj.value.push(item.content);
            obj.extra.push({
              metadata: {
                type: ChatContextType.article,
                description: item.metadata.filePath.join(','),
              },
            });
            return obj;
          },
          {
            value: [],
            extra: [],
          } as {
            value: string[];
            extra: WorkflowExtraMetadata[];
          },
        );
      } else if (outputName === 'first') {
        const item = fileChunkList.flat()[0];
        return {
          value: item.content,
          extra: {
            metadata: {
              type: ChatContextType.article,
              description: item.metadata.filePath.join(','),
            },
          },
        };
      }
      const metadataMap = (item: ArticleChunk) =>
        ({
          metadata: {
            type: item.metadata.type,
            description: item.metadata.filePath.join(','),
          },
        }) as WorkflowExtraMetadata;

      return {
        value: fileChunkList.map((item) => {
          if (Array.isArray(item)) {
            return item.map((item) => item.content);
          }
          return item.content;
        }),
        extra: fileChunkList.map((item) => {
          if (Array.isArray(item)) {
            return item.map(metadataMap);
          }
          return metadataMap(item);
        }),
      };
    };
  }
}
