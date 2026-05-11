import * as v from 'valibot';
import { t } from './t';
import { ExtensionContext } from '../token';
import { FolderName, WorkspaceService } from '../service/workspace.service';
import fs from 'fs';
import { openFolder } from '../webview/tree/folder.tree';
import { gt } from 'semver';
import path from 'path';
import { downloadFile } from '@cyia/dl';
import { createTempDir } from '@share/util/get-temp-dir';

export const RequestRouter = t.router({
  version: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const ec = ctx.injector.get(ExtensionContext);
    const version = ec.extension.packageJSON['version'];
    return fetch(`https://shenghuabi.top/api/download/version`, {
      method: 'get',
    })
      .then((a) => a.json() as any as { version: string })
      .then((data) => {
        return {
          ...data,
          currentVersion: version,
          needUpdate: gt(data.version, version),
        } as const;
      });
  }),
  download: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const workspace = ctx.injector.get(WorkspaceService);
    const dir = workspace.dir[FolderName.updatePackageDir]();
    await fs.promises.mkdir(dir, { recursive: true });
    const result = await downloadFile(
      `https://shenghuabi.top/api/download/${process.platform}_${process.arch}`,
      { directory: await createTempDir() },
    );
    console.log(result!.getFilePath());
    openFolder(path.dirname(result!.getFilePath()));
  }),
});
