import { equal, ok } from 'assert';
import { getInjectEnv } from '../test-util/env';
import { Injector } from 'static-injector';
import { MindService } from '../../src/service/mind/mind.service';
import { writeConfig } from '../test-util/config';
import { ExtensionConfig } from '../../src/service/config.service';
import { getDefaultDir } from '../test-util/test-path';
describe('自定义主题', () => {
  let injector: Injector;
  beforeEach(async () => {
    injector = getInjectEnv();
    await ExtensionConfig.defaultDir.set(getDefaultDir());
  });
  afterEach(async () => {
    await writeConfig({});
  });
  it('压缩', async () => {
    let result = await injector.get(MindService).getNodeThemeItem('test.css');
    ok(result.length);
  });
});
