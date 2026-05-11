import { equal, ok } from 'assert';
import { Injector } from 'static-injector';
import { getInjectEnv } from '../test-util/env';
import { ExtensionConfig } from '../../src/service/config.service';
import {
  getDefaultDir,
  getFixture,
  getWorkSpaceDir,
} from '../test-util/test-path';
import { MindZipMigrate } from '../../src/migrate/mind-zip/mind-zip.migrate';
import JSZip from 'jszip';
import {
  documentName,
  imgDirNameSlash,
} from '../../src/class/flow-file/flow-file';
import { writeConfig } from '../test-util/config';
import { path } from '@cyia/vfs2';
import * as fs from 'fs/promises';
describe('脑图迁移', () => {
  let injector: Injector;
  beforeEach(async () => {
    let mindDir = path.join(getFixture(), 'migrate/card-zip');
    await fs.cp(mindDir, getWorkSpaceDir(), { recursive: true, force: true });
    injector = getInjectEnv();
    await ExtensionConfig.defaultDir.set(getDefaultDir());
  });
  afterEach(async () => {
    await writeConfig({});
    await fs.rm(path.join(getWorkSpaceDir(), '.assets'), { recursive: true });
    await fs.rm(path.join(getWorkSpaceDir(), 'error.nt'));
    await fs.rm(path.join(getWorkSpaceDir(), 'mind-migrate.nt'));
    await fs.rm(path.join(getWorkSpaceDir(), 'new-nt.nt'));
  });
  it('bson=>zip', async () => {
    let { resultList, errorList } = await injector
      .get(MindZipMigrate)
      .getMigrateList();
    equal(resultList.length, 2);
    equal(errorList.length, 1);
    for (let index = 0; index < resultList.length; index++) {
      const item = resultList[index];
      if (item.fileName === 'mind-migrate.nt') {
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
        ok(result.id);
        let image1 = await zip
          .file(
            `${imgDirNameSlash}1b3a64cf-525c-4c65-aa3b-a614c8fbe086-测试.nt.png`,
          )
          ?.async('uint8array');
        let image2 = await zip
          .file(
            `${imgDirNameSlash}de17ece5-1106-42a1-9252-59ef242363bdyml文件.png`,
          )
          ?.async('uint8array');
        ok(image1);
        ok(image2);
      }
    }
  });
  // it.only('bson=>zip', async () => {
  //   let result = await injector.get(MindZipMigrate).run();
  //   equal(result, true);
  // });
});
