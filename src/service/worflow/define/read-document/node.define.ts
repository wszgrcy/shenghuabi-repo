import * as v from 'valibot';

export const READ_DOCUMENT_NODE_DEFINE = v.object({
  filePath: v.pipe(v.string(), v.title('文档名')),
});
