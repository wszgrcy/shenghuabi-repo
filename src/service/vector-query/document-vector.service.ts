import { RootStaticInjectOptions, inject } from 'static-injector';
import { WorkspaceService } from '../workspace.service';

import { CreateKnowledgeWithType } from '../../share';
import { MIND_EXT_LIST } from '../../const';
import { CustomKnowledgeManagerService } from '../knowledge/custom-knowledge.manager.service';
import {
  ArticleKnowledgeService,
  ArticlePayloadType,
} from '@shenghuabi/knowledge/knowledge';
import { dynamicInject, ExtensionContext } from '../../token';
import { v4 } from 'uuid';
import { LogFactoryService } from '../log.service';
import { fromAsync } from '@cyia/util';

export class DocumentVectorService extends RootStaticInjectOptions {
  #channel = inject(LogFactoryService).getLog('knowledge');
  workspace = inject(WorkspaceService);

  #context = inject(ExtensionContext);
  #manager$$ = dynamicInject(CustomKnowledgeManagerService);
  articleName = new Promise(async (resolve) => {
    let id = this.#context.workspaceState.get('id');
    if (!id) {
      id = v4();
      await this.#context.workspaceState.update('id', id);
    }
    resolve(id);
  }).then((id) => `[文章]-${id}`);
  /**
   * 依赖工作区
   */
  async syncDocument() {
    const articleName = await this.articleName;
    const hasGraph = this.#manager$$().exist(articleName);
    if (!hasGraph) {
      await this.#manager$$().initKnoledge({
        name: articleName,
        type: 'article',
        graphIndex: false,
        chunkSize: 200,
        embeddingTemplate: {},
      } as CreateKnowledgeWithType);
    }

    const nFolder = this.workspace.nFolder();
    // todo 重构时再优化
    /** 查询工作区所有文件用 */
    const result$$ = this.workspace.vfs.glob('**/*', {
      cwd: nFolder,
      exclude: [`**/*{${MIND_EXT_LIST.join(',')}}`],
    });

    await this.#manager$$().importTextFile(
      articleName,
      nFolder,
      await fromAsync(result$$),
    );
  }

  /** 文章使用? */
  async querySimilar(value: string, articleList: string[], limit: number) {
    const articleName = await this.articleName;

    return this.#manager$$()
      .get(articleName)
      .then((instance) => {
        return instance.searchChunk(
          value,
          {
            must: [
              {
                key: 'fullName',
                match: {
                  any: articleList,
                },
              },
            ],
          },
          { limit },
        );
      })
      .then((result) => result.map((item) => item.payload));
  }
  /** 文章使用? */
  async aiSearch(value: string, includes: string[], excludes: string[]) {
    const articleName = await this.articleName;

    const filterObj = {
      must: [] as any[],
    };
    if (includes.length) {
      filterObj.must.push({ key: 'dir', match: { any: includes } });
    }
    if (excludes.length) {
      filterObj.must.push({ key: 'dir', match: { except: excludes } });
    }

    return this.#manager$$()
      .get(articleName)
      .then((instance) => {
        return (instance as ArticleKnowledgeService).searchGroupByChunk(
          value,
          { limit: 20, group_size: 50 },
          filterObj,
        );
      })
      .then((result) =>
        result.map((item) =>
          item.hits.map((item) => item.payload as ArticlePayloadType),
        ),
      );
  }

  async queryKnowledge(knowledgeName: string, value: string, limit: number) {
    this.#channel.info(`查询知识库`, knowledgeName, value);
    return this.#manager$$()
      .get(knowledgeName)
      .then((instance) => {
        return instance.searchChunk(value, undefined, { limit: limit });
      })
      .then((result) => result.map((item) => item.payload));
  }
}
