import * as v from 'valibot';
import { t } from './t';
import { WorkspaceService } from '../service/workspace.service';

export const DocumentRouter = t.router({
  // findOne: t.procedure
  //   .input(v.object({ filePath: v.string() }))
  //   .query(async ({ input, ctx }) => {
  //     const vfs = ctx.injector.get(WorkspaceService).rootVfs;
  //     return vfs.readContent(input.filePath);
  //   }),
  // findOneByArrayBuffer: t.procedure
  //   .input(v.object({ filePath: v.string() }))
  //   .query(async ({ input, ctx }) => {
  //     const vfs = ctx.injector.get(WorkspaceService).vfs;
  //     return vfs.read(input.filePath);
  //   }),
  // save: t.procedure
  //   .input(v.object({ filePath: v.string(), data: v.string() }))
  //   .query(async ({ input, ctx }) => {
  //     const vfs = ctx.injector.get(WorkspaceService).vfs;
  //     await vfs.write(input.filePath, input.data);
  //   }),
  // saveByArrayBuffer: t.procedure
  //   .input(
  //     v.object({ filePath: v.string(), data: v.custom<ArrayBuffer>(Boolean) }),
  //   )
  //   .query(async ({ input, ctx }) => {
  //     const vfs = ctx.injector.get(WorkspaceService).vfs;

  //     await vfs.write(input.filePath, new Uint8Array(input.data));
  //   }),
  /** 脑图保存图片用 */
  saveFile: t.procedure
    .input(
      v.object({
        filePath: v.string(),
        data: v.custom<ArrayBuffer>(Boolean),
        extension: v.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const vfs = ctx.injector.get(WorkspaceService).rootVfs;
      let filePath = input.filePath;
      if (input.extension) {
        filePath = input.filePath.replace(/\.*$/, input.extension);
      }
      await vfs.write(filePath, new Uint8Array(input.data));
    }),
});
