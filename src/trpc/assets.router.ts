import * as v from 'valibot';
import { t } from './t';
import { WorkspaceService } from '../service/workspace.service';

import { selectFile } from '../util/platform/select-file';
import { path } from '@cyia/vfs2';
import {
  bufferToImageBase64,
  convertToCompatibleBuffer,
} from '@shenghuabi/knowledge/image';
import { IMAGE_SUFFIX } from '../service/const';
export const AssetsRouter = t.router({
  loadFileText: t.procedure
    .input(
      v.object({
        localPath: v.string(),
        root: v.optional(v.string()),
      }),
    )
    .query(async ({ input, ctx }) => {
      const localPath = path.resolve(
        input.root
          ? path.dirname(input.root)
          : (ctx as any)['path']['absFileDir'],
        input.localPath,
      );
      const workspace = ctx.injector.get(WorkspaceService);
      const content = await workspace.rootVfs.readContent(localPath);
      return content!;
    }),

  getImageBase64: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    return selectFile(`请选择图片`, false, {
      [`图片`]: IMAGE_SUFFIX,
    }).then(async (uri) => {
      if (uri) {
        const imageResult = await convertToCompatibleBuffer(uri.fsPath);
        if (!imageResult.type) {
          return undefined;
        }
        return bufferToImageBase64(imageResult);
      }
      return undefined;
    });
  }),
  imageConvertBase64: t.procedure
    .input(v.object({ data: v.custom<ArrayBuffer>(Boolean) }))
    .query(async ({ input, ctx }) => {
      const imageResult = await convertToCompatibleBuffer(
        new Uint8Array(input.data),
      );
      if (!imageResult.type) {
        return undefined;
      }
      return bufferToImageBase64(imageResult);
    }),
});
