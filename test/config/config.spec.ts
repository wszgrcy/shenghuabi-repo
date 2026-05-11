import { deepStrictEqual, equal, strictEqual } from 'assert';
import { ExtensionConfig } from '../../src/service/config.service';
import { writeConfig } from '../test-util/config';
describe('配置', () => {
  beforeEach(async () => {
    await writeConfig({});
  });
  afterEach(async () => {
    await writeConfig({});
  });
  it('search.article', async () => {
    await ExtensionConfig['search.article'].update((value) => {
      return {} as any;
    });
    let config = ExtensionConfig['search.article']();
    deepStrictEqual(config, { chunkSize: 200 });
    await ExtensionConfig['search.article'].update((value) => {
      return { ...value, chunkSize: 201 };
    });
    deepStrictEqual(ExtensionConfig['search.article'](), { chunkSize: 201 });
    await ExtensionConfig['search.article'].update((value) => {
      return {} as any;
    });
  });
});
