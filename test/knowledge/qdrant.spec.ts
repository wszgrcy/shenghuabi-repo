import { equal } from 'assert';
import { getInjectEnv } from '../test-util/env';
import { QdrantService } from '../../src/service/external-call/qdrant.service';
import { QdrantClientService } from '../../src/service/vector/qdrant-client.service';
import { ExtensionConfig } from '../../src/service/config.service';
import { path } from '@cyia/vfs2';
import {
  getDefaultDir,
  getSoftWareDir,
  getWorkSpaceDir,
} from '../test-util/test-path';
import { writeConfig } from '../test-util/config';
import { Injector } from 'static-injector';
import { cp, rm } from 'fs/promises';
import { delay } from '../test-util/delay';
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
  it('已启动', async () => {
    let result = await qdClient.collectionExists('foo');
    equal(result.exists, false);
  });
  it('创建集合', async () => {
    let result = await qdClient.createCollection('foo', {
      vectors: {
        content: {
          size: 100,
          distance: 'Cosine',
          on_disk: true,
        },
      },
    });
    equal(result, true);
    let { exists } = await qdClient.collectionExists('foo');
    equal(exists, true);
  });
});
