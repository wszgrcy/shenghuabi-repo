import { Injector } from 'static-injector';

export async function migrateExportConfig(input: any, injector: Injector) {
  if (!input.version || input.version === 1) {
    input.options = {
      ...input.options,
      collectionList: [
        {
          collectionName: input.options.name,
          embedding: input.options.embedding,
          chunkSize: input.options.chunkSize,
        },
      ],
    };
    delete input.options.embedding;
    delete input.options.chunkSize;
    input.options.type ??= 'knowledge';
    input.options.activateCollection = input.options.name;
    // todo 都需要先导入,然后迁移
    // 看版本,如果不是v2那么就需要设置激活集合和索引之类的
    // await addIndexIfNotFound(input.options, injector);
    // input.version = 2;
  }
  return input;
}
