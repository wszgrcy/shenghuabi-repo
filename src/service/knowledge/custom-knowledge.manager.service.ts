import {
  ArticleKnowledgeConfigDefine,
  ContentParserToken,
  DictCollectionInput,
  DictKnowledgeConfigDefine,
  DirToken,
  GraphCollectionInput,
  GraphKnowledgeConfig,
  GraphKnowledgeConfigDefine,
  KnowledgeConfig,
  KnowledgeManagerService,
  NormalKnowledgeConfig,
  NormalKnowledgeConfigDefine,
  OCR,
  OCRToken,
  ReRankerToken,
  Text2Vec,
  Text2VecToken,
  TextSplitter,
  TextSplitterToken,
} from '@shenghuabi/knowledge/knowledge';
import {
  computed,
  inject,
  Injector,
  Provider,
  R3Injector,
  signal,
  Signal,
} from 'static-injector';
import * as v from 'valibot';
import {
  KnowledgeCollectionConfigType,
  KnowledgeItemDefine,
  KnowledgeItemType,
} from '../../share/define/knowledge/working-knowledge';
import { FolderName, WorkspaceService } from '../workspace.service';
import { LogToken } from '@shenghuabi/knowledge/util';
import { path } from '@cyia/vfs2';
import { Text2VecService } from '../external-call/text2vec.service';
import { OCRService } from '../external-call/ocr.service';
import {
  CreateKnowledgeWithType,
  deepClone,
  DictImportConfigWithType,
  FullKnowledgeCreateParseDefine,
} from '../../share';
import { parse, stringify } from 'yaml';
import { deepEqual } from 'fast-equals';
import { selectFile, selectFolder } from '@share/util/platform/select-file';
import { getTempDir } from '@share/util/get-temp-dir';
import { ExportKnowledgeConfigDefine, ExportKnowledgeMetadata } from './type';
import { pathToFileURL } from 'url';
import { RagWorkflowParser } from '../ai/rag/parse/workflow-parser';
import { OriginConfigToken } from './token';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { minChunkOverlap, separators } from '../vector-query/const';
import { LogFactoryService } from '../log.service';
import { EmbeddingBase } from '../external-call/embedding/embedding.service';
import { PluginService } from '../plugin/plugin.service';
import { KnowledgeConfigService } from './knowledge-config.service';
import { ReRankerService } from '../external-call/ranker/ranker.service';
import { QdrantServerService } from '@shenghuabi/knowledge/qdrant';
import { ZipService, UnzipService } from '@cyia/zip';
function collectionToNormalInputCollection(
  item: KnowledgeCollectionConfigType,
): DictCollectionInput {
  return {
    collectionName: item.collectionName,
    embeddingTemplate: item.embeddingTemplate,
    size: item.embedding.size,
  };
}
const collectionToDictInputCollection = collectionToNormalInputCollection;
function collectionToGraphInputCollection(
  item: KnowledgeCollectionConfigType,
): GraphCollectionInput {
  return {
    collectionName: item.collectionName,
    embeddingTemplate: item.embeddingTemplate,
    size: item.embedding.size,
  };
}
const ManagerConfigDefine = v.pipe(
  KnowledgeItemDefine,
  v.transform((item) => {
    const baseConfig = {
      activateCollection: item.activateCollection,
      name: item.name,
    };
    if (item.type === 'dict') {
      return v.parse(DictKnowledgeConfigDefine, {
        ...baseConfig,
        type: 'dict',
        extractorWord: item.options?.extractorWord,
        useOcr: item.options?.useImage,
        collectionList: item.collectionList.map(
          collectionToDictInputCollection,
        ),
      });
    } else if (item.type === 'knowledge') {
      if (item.graphIndex) {
        return v.parse(GraphKnowledgeConfigDefine, {
          ...baseConfig,
          maxChunkAsync: item.maxChunkAsync,
          collectionList: item.collectionList.map(
            collectionToGraphInputCollection,
          ),
        } as GraphKnowledgeConfig);
      } else {
        return v.parse(NormalKnowledgeConfigDefine, {
          ...baseConfig,
          collectionList: item.collectionList.map(
            collectionToNormalInputCollection,
          ),
        } as NormalKnowledgeConfig);
      }
    } else if (item.type === 'article') {
      return v.parse(ArticleKnowledgeConfigDefine, {
        ...baseConfig,
        collectionList: item.collectionList.map(
          collectionToNormalInputCollection,
        ),
      } as NormalKnowledgeConfig);
    }
    throw '';
  }),
);
export class CustomKnowledgeManagerService extends KnowledgeManagerService {
  #knowledgeConfig = inject(KnowledgeConfigService);
  #qdrant = inject(QdrantServerService);
  #workspace = inject(WorkspaceService);
  #vfs = this.#workspace.rootVfs;
  #zip = inject(ZipService);

  #text2vec = inject(Text2VecService);
  #dir = computed(() => {
    return this.#workspace.dir[FolderName.knowledgeDir]();
  });
  #injector = inject(Injector);
  #configCache = new Map<string, Signal<KnowledgeConfig>>();

  /** 临时new */
  #newConfig = signal<Record<string, KnowledgeItemType> | undefined>(undefined);
  /** 包含新建和已经创建的内容 */
  #fullOriginConfig = computed(
    () => {
      return {
        ...this.#knowledgeConfig.originConfig$$(),
        ...this.#newConfig(),
      };
    },
    { equal: deepEqual },
  );

  async #getOrCreateConfig(name: string) {
    let data = this.#configCache.get(name);
    if (!data) {
      const config$$ = computed(() => this.#fullOriginConfig()[name], {
        equal: deepEqual,
      });
      data = computed(() => {
        return v.parse(ManagerConfigDefine, config$$());
      });

      this.#configCache.set(name, data);
    }
    return data;
  }
  override async getConfig(name: string) {
    return this.#getOrCreateConfig(name);
  }
  protected override async getInjector(
    name: string,
    extraProviders?: Provider[],
  ): Promise<R3Injector> {
    const config = await this.#getOrCreateConfig(name);
    const collectionObject$$ = computed(() => {
      return this.#fullOriginConfig()[name].collectionList.reduce(
        (obj, item) => {
          obj[item.collectionName] = item;
          return obj;
        },
        {} as Record<string, KnowledgeCollectionConfigType>,
      );
    });
    return super.getInjector(name, [
      {
        provide: OCRToken,
        useValue: ((str) => {
          return this.#orcSerivce
            .autoConvert(str)
            .then((res) => res ?? '')
            .catch(() => '');
        }) as OCR,
      },
      {
        provide: DirToken,
        useValue:
          config().type === 'article'
            ? computed(() => this.#workspace.nFolder())
            : computed(() => path.join(this.#dir(), name)),
      },
      // 根据不同配置搞
      { provide: Text2VecToken, useValue: await this.#createText2vec(name) },
      { provide: ReRankerToken, useValue: await this.#createReRanker(name) },
      {
        provide: LogToken,
        useValue: this.#getLog(name),
      },
      // 图谱使用,默认可以不注入
      {
        provide: ContentParserToken,
        useClass: RagWorkflowParser,
      },
      {
        provide: OriginConfigToken,
        useValue: computed(() => this.#knowledgeConfig.originConfig$$()[name]),
      },
      {
        provide: TextSplitterToken,
        useValue: ((content, meta, collection) => {
          const item = collectionObject$$()[collection];
          const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: item.chunkSize,
            chunkOverlap: minChunkOverlap(item.chunkSize),
            separators: separators,
          });
          return textSplitter.createDocuments([content], [meta]);
        }) as TextSplitter,
      },
      ...this.#injector.get(PluginService).knowledgeProviderList$$(),
    ]);
  }

  async initKnoledge(data: CreateKnowledgeWithType | DictImportConfigWithType) {
    const start = Date.now();
    this.#channel.info('准备解析配置');
    const item = v.parse(FullKnowledgeCreateParseDefine, {
      ...data,
      // todo batchsize之类的参数?
      embedding: await this.#text2vec.getOptions(),
    }) as KnowledgeItemType;
    this.#channel.info('配置解析成功', item);

    this.#newConfig.update((config) => {
      config = { ...config };
      config[item.name] = item;
      return config;
    });
    this.#channel.info('准备获得标准配置');

    const config = await this.#getOrCreateConfig(item.name);
    await this.create(item.name, config().collectionList[0]);
    if (data.type === 'dict') {
      const count = await this.importDict(item.name, {
        filePath: data.data.filePath,
        type: data.data.type,
        regCode: data.data.regCode,
        userId: data.data.userId,
      });
      this.#channel.success(
        `导入 ${count} 条,用时 ${((Date.now() - start) / 1000).toFixed(2)} 秒`,
      );
    }
    // 创建后应该保存
    await this.#writeConfig(
      await this.#mergeCollection(item.name, item.collectionList[0]),
    );
    this.#channel.success(`[${item.name}]创建成功`);
  }
  async addCollection2(
    name: string,
    collection: KnowledgeCollectionConfigType,
  ) {
    this.#channel.createProgress(`${name} 添加集合`);
    const originConfig = this.#knowledgeConfig.originConfig$$()[name];
    const instance = await this.#text2vec.get(collection.embedding);
    collection.embedding = {
      ...collection.embedding,
      size: (await instance.getSize())!,
    };

    this.#newConfig.update((data) => {
      data = { ...data };
      data[name] = {
        ...originConfig,
        collectionList: [...originConfig.collectionList, collection],
      };
      return data;
    });
    const input = await this.#output2Input(name, collection);
    await this.addCollection(name, input);
    const config = await this.#mergeCollection(name, collection);
    await this.#writeConfig(config);
    this.#channel.success(`${name} 已添加 ${collection.collectionName} 集合`);
  }
  async changeActivateCollection2(name: string, collectionName: string) {
    await this.changeActivateCollection(name, collectionName);

    const writeConfig = deepClone(
      this.#knowledgeConfig.originConfig$$()![name],
    );
    writeConfig.activateCollection = collectionName;
    await this.#writeConfig(writeConfig);
    this.#channel.success(`${name} 变更集合为 ${collectionName}`);
  }

  // 导入
  // 导出
  // 修改激活知识库(缺接口)
  async #output2Input(name: string, collection: KnowledgeCollectionConfigType) {
    const config = await this.#getOrCreateConfig(name);
    switch (config().type) {
      case 'dict': {
        return collectionToDictInputCollection(collection);
      }
      case 'normal': {
        return collectionToNormalInputCollection(collection);
      }
      case 'normal-graph': {
        return collectionToGraphInputCollection(collection);
      }
      default:
        throw '';
    }
  }
  /** 写入配置,并更新 */
  async #writeConfig(config: KnowledgeItemType) {
    // 内存中更新
    this.#knowledgeConfig.originConfigList$.update((list) => {
      list = list.slice();
      const index = list.findIndex((item) => item.name === config.name);
      if (index === -1) {
        list.push(config);
      } else {
        list[index] = config;
      }
      return list;
    });

    await this.#knowledgeConfig.updateConfig();

    this.#newConfig.update((data) => {
      data = { ...data };
      delete data[config.name];
      return data;
    });
  }
  async #mergeCollection(
    name: string,
    collection: KnowledgeCollectionConfigType,
  ) {
    const writeConfig = deepClone(this.#fullOriginConfig()![name]);
    const index = writeConfig.collectionList.findIndex(
      ({ collectionName }) => collection.collectionName === collectionName,
    );
    if (index === -1) {
      writeConfig.collectionList.push(collection);
    } else {
      writeConfig.collectionList[index] = collection;
    }
    writeConfig.activateCollection = collection.collectionName;
    return writeConfig;
  }
  override async deleteCollection(
    name: string,
    collectionName: string,
  ): Promise<boolean> {
    const result = await super.deleteCollection(name, collectionName);
    if (!result) {
      return result;
    }

    await this.#writeConfig(
      await this.#deleteCollectionInConfig(name, collectionName),
    );
    this.#channel.success(`${name} 删除集合 ${collectionName}`);
    return true;
  }
  async #deleteCollectionInConfig(name: string, deletedCollectionName: string) {
    const writeConfig = deepClone(
      this.#knowledgeConfig.originConfig$$()![name],
    );
    const index = writeConfig.collectionList.findIndex(
      ({ collectionName }) => deletedCollectionName === collectionName,
    );
    if (index !== -1) {
      writeConfig.collectionList.splice(index, 1);
    }
    return writeConfig;
  }
  override async destroy(name: string): Promise<void> {
    await super.destroy(name);
    this.#knowledgeConfig.originConfigList$.update((list) => {
      list = list.slice();
      const index = list.findIndex((item) => item.name === name);
      if (index === -1) {
      } else {
        list.splice(index, 1);
      }
      return list;
    });

    await this.#knowledgeConfig.updateConfig();
    this.#newConfig.update((data) => {
      data = { ...data };
      delete data[name];
      return data;
    });
    this.#channel.success(`[${name}]删除成功`);
  }

  async #createText2vec(name: string) {
    const configItem$$ = computed(() => this.#fullOriginConfig()[name], {
      equal: deepEqual,
    });
    const collectionObj = computed(() => {
      return configItem$$().collectionList.reduce(
        (obj, item) => {
          obj[item.collectionName] = item;
          return obj;
        },
        {} as Record<string, KnowledgeCollectionConfigType>,
      );
    });
    const text2VecMap = new Map<string, EmbeddingBase>();
    const getText2vec = async (collectionName: string) => {
      let item = text2VecMap.get(collectionName);
      if (!item) {
        item = await this.#text2vec.get(
          collectionObj()[collectionName].embedding,
        );
        text2VecMap.set(collectionName, item);
      }
      return item;
    };
    return (async (str, collectionName) => {
      return (await getText2vec(collectionName)).extractor(str);
    }) as Text2Vec;
  }
  #reranker = inject(ReRankerService);
  async #createReRanker(name: string) {
    return this.#reranker.toKnowledge();
  }
  #channel = inject(LogFactoryService).getLog('knowledge');
  #getLog(name: string) {
    // 可以加name提示
    return {
      info: (...args: any[]) => {
        this.#channel.info(name, ...args);
      },
      warn: (...args: any[]) => {
        this.#channel.warn(name, ...args);
      },
      error: (...args: any[]) => {
        this.#channel.failed(name, ...args);
      },
    };
  }
  #orcSerivce = inject(OCRService);
  async export2(name: string) {
    // 选择
    const exportDir = await selectFolder('请选择导出位置');
    if (!exportDir) {
      return;
    }
    this.#channel.info(`[${name}]准备导出`);
    // 导出知识库
    const snapshotList = await this.export(name);
    const metadata = {
      snapshot: [],
      data: {},
    } as any as ExportKnowledgeMetadata;
    const SNAPSHOT_NAME = 'snapshot';
    const tempDir = getTempDir();

    for (const item of snapshotList) {
      /** 集合导出位置 */
      const collectionDir = path.join(
        this.#qdrant.snapshotDir$$(),
        item.collection,
      );
      const outputRelDir = path.join(SNAPSHOT_NAME, item.collection);
      // 元数据
      metadata.snapshot.push({
        collection: item.collection,
        filePath: path.join(outputRelDir, item.name!),
        checksum: item.checksum!,
      });
      // 移动到临时文件夹
      await this.#vfs.move(
        path.join(collectionDir, item.name!),
        path.join(tempDir, outputRelDir, item.name!),
      );
      this.#vfs.rm(path.join(collectionDir, `${item.name}.checksum`));
    }
    const config = this.#knowledgeConfig.originConfig$$()![name];
    const DATA_NAME = 'data';
    const dataFilePath = path.join(this.#dir(), name);
    // 复制文件资源
    if (await this.#vfs.exists(dataFilePath)) {
      // 保存通用资源
      await this.#vfs.cp(dataFilePath, path.join(tempDir, DATA_NAME), {
        recursive: true,
      });
      metadata['data'].filePath = DATA_NAME;
    }
    await this.#vfs.writeFile(
      path.join(tempDir, './config.yml'),
      stringify(
        v.parse(ExportKnowledgeConfigDefine, {
          options: config,
          metadata,
          version: 3,
        }),
      ),
    );

    await this.#zip.tgz(
      tempDir,
      path.join(exportDir.fsPath, `${name}.knowledge.export.tar.gz`),
      {},
    );
    try {
      await this.#vfs.rm(tempDir, { recursive: true });
    } catch (error) {}
    this.#channel.success(`[${name}]导出成功`);
    return snapshotList;
  }
  #unzip = inject(UnzipService);
  async import2() {
    // 选择导出
    const fileUri = await selectFile(`导入知识库或字典`, false, {
      格式: ['export.7z', 'export.tar.gz', 'export.tgz'],
    });
    if (!fileUri) {
      return;
    }
    this.#channel.info(`准备导入知识库`);
    // 解压到临时文件夹
    const tempDir = getTempDir();
    await this.#unzip.autoUnzip(fileUri.fsPath, tempDir);
    // 解析配置
    const configFilePath = path.join(tempDir, 'config.yml');
    const data = parse(
      (await this.#workspace.rootVfs.readContent(configFilePath))!,
    );
    if (data.version < 3) {
      throw new Error('导入知识库版本过低;');
    }
    const exportConfig = v.parse(ExportKnowledgeConfigDefine, data);
    const inputConfig = v.parse(ManagerConfigDefine, exportConfig.options);
    //导入到数据库
    const snapshot = exportConfig.metadata.snapshot;

    this.#newConfig.update((config) => {
      config = { ...config };
      config[inputConfig.name] = exportConfig.options;
      return config;
    });
    await this.import(inputConfig.name, {
      snapshotList: snapshot.map((item) => ({
        ...item,
        filePath: pathToFileURL(path.join(tempDir, item.filePath)).toString(),
      })),
      activateCollection: exportConfig.options.activateCollection,
      type: inputConfig.type,
    });

    const knowledgeDir = this.#dir();
    // 删除原来的,把当前的资源复制进去
    try {
      await this.#vfs.rm(path.join(knowledgeDir, exportConfig.options.name), {
        recursive: true,
      });
    } catch (error) {}
    if (exportConfig.metadata.data.filePath) {
      await this.#vfs.move(
        path.join(tempDir, exportConfig.metadata.data.filePath),
        path.join(knowledgeDir, exportConfig.options.name),
      );
    }
    // 写入配置
    await this.#writeConfig(exportConfig.options);
    this.#channel.success(`[${inputConfig.name}]导入完成`);
    try {
      await this.#vfs.rm(tempDir, { recursive: true });
    } catch (error) {}
  }
  hasGraph(name: string) {
    const config = this.#knowledgeConfig.originConfig$$()[name];
    return config && config.type === 'knowledge' && config.graphIndex;
  }
  exist(name: string) {
    return this.#knowledgeConfig.originConfig$$()[name];
  }
}
