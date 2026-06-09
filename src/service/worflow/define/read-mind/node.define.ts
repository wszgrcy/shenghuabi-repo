import * as v from 'valibot';

export const READ_MIND_NODE_DEFINE = v.object({
  fileName: v.pipe(v.string(), v.title('文件名')),
});
