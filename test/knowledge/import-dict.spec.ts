import { equal } from 'assert';
import { getInjectEnv } from '../test-util/env';
import { QdrantService } from '../../src/service/external-call/qdrant.service';
import { QdrantClientService } from '../../src/service/vector/qdrant-client.service';
import { ExtensionConfig } from '../../src/service/config.service';
import { path } from '@cyia/vfs2';
import {
  getDefaultDir,
  getDictDir,
  getSoftWareDir,
  getWorkSpaceDir,
} from '../test-util/test-path';
import { writeConfig } from '../test-util/config';
import { Injector } from 'static-injector';
import { cp, rm } from 'fs/promises';
import { delay } from '../test-util/delay';
import { KnowledgeService } from '../../src/service/vector';
import { KnowledgeDictSertvice } from '../../src/service/knowledge/knowledge.dict.service';
describe('qdrant', () => {
  let injector: Injector;
  let qdClient: QdrantClientService;
  let qdrant: QdrantService;
  beforeEach(async () => {
    try {
      await rm(path.join(getDefaultDir(), 'qdrant'), {
        force: true,
        recursive: true,
      });
      await rm(path.join(getDefaultDir(), 'knowledge_base'), {
        force: true,
        recursive: true,
      });
    } catch (error) {}
    await cp(
      path.join(getSoftWareDir(), 'qdrant.exe'),
      path.join(getDefaultDir(), 'qdrant/qdrant.exe'),
      { force: true, recursive: true },
    );
    await ExtensionConfig.defaultDir.set(getDefaultDir());
    injector = getInjectEnv();
    qdrant = injector.get(QdrantService);
    qdrant.init();
    qdClient = injector.get(QdrantClientService);
    qdClient.init();
  });
  afterEach(async () => {
    qdrant.stop();
    await writeConfig({});
    await delay(100);
  });
  it('导入yaml字典', async () => {
    let config = {
      type: 'dict' as const,
      chunkSize: 200,
      data: {
        filePath: path.join(getDictDir(), 'test1.yml'),
        type: 'yaml' as const,
      },
      options: { useImage: false, extractorWord: false },
      embeddingTemplate: { entry: { enable: false, value: '' } },
      name: 'foo',
    };
    let data = config.data;
    const service = injector.get(KnowledgeService);

    const item = await service.createKnowledge(config, '字典');
    await injector.get(KnowledgeDictSertvice).importDict(item, data);
    // 查询测试
    let { exists } = await qdClient.collectionExists('foo');
    equal(exists, true);
    let { points } = await qdClient.scroll('foo', {
      limit: 1,
      filter: {
        must: [{ key: 'word', match: { value: 'word1' } }],
      },
    });
    equal(points.length, 1);
    equal(points[0].payload!['word'], 'word1');
    equal(points[0].payload!['content'], 'content1');
  });
});
