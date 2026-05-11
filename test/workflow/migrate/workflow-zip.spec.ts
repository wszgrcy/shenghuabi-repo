import { equal, ok } from 'assert';
import { Injector } from 'static-injector';

import JSZip from 'jszip';

import { path } from '@cyia/vfs2';
import * as fs from 'fs/promises';
import {
  documentName,
  imgDirNameSlash,
} from '../../../src/class/flow-file/flow-file';
import { MindZipMigrate } from '../../../src/migrate/mind-zip/mind-zip.migrate';
import { ExtensionConfig } from '../../../src/service/config.service';
import { writeConfig } from '../../test-util/config';
import { getInjectEnv } from '../../test-util/env';
import {
  getFixture,
  getWorkSpaceDir,
  getDefaultDir,
} from '../../test-util/test-path';
import { WorkflowZipMigrate } from '../../../src/migrate/worflow-zip/workflow-zip.migrate';
describe('工作流迁移', () => {
  let injector: Injector;
  beforeEach(async () => {
    injector = getInjectEnv();
    await ExtensionConfig.defaultDir.set(getDefaultDir());
    await ExtensionConfig.workflow.update((config) => {
      return {
        ...config,
        dir: path.join(getFixture(), 'migrate/workflow-zip'),
      };
    });
  });
  afterEach(async () => {
    await writeConfig({});
    let filePath = path.join(getFixture(), 'migrate/workflow-zip');
  });
  it('bson=>zip', async () => {
    let { resultList, errorList } = await injector
      .get(WorkflowZipMigrate)
      .getMigrateList();
    equal(resultList.length, 2);
    equal(errorList.length, 1);
    for (let index = 0; index < resultList.length; index++) {
      const item = resultList[index];
      if (item.fileName === 'hello.workflow') {
        let zipFile = await item.zip;
        let data = await new Promise<Uint8Array>((resolve) => {
          let list: Uint8Array[] = [];
          zipFile.outputStream.on('data', (value) => {
            list.push(value);
          });
          zipFile.outputStream.on('end', function () {
            resolve(new Uint8Array(Buffer.concat(list)));
          });
        });
        let zip = new JSZip();
        zip = await zip.loadAsync(data);
        let result = JSON.parse(await zip.file(documentName)!.async('string'));
        equal(typeof result, 'object');
        ok(!(result instanceof Uint8Array));
        ok(Object.keys(result).length);
        ok(result.flow);
      }
    }
  });
  // it.only('更新', async () => {
  //   let result = await injector.get(WorkflowZipMigrate).run();
  //   equal(result, true);
  // });
});
