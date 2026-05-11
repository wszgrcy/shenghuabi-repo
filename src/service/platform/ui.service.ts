import { inject, RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import { WorkspaceService } from '../workspace.service';
import { path } from '@cyia/vfs2';
/**
 * todo 应该合并Platform Api */
export class UIService extends RootStaticInjectOptions {
  #vfs = inject(WorkspaceService).rootVfs;
  async rename(
    filePath: string,
    extname = '.workflow',
    title = '请输入工作流名称',
  ) {
    const name = path.basename(filePath, extname);
    const dirName = path.dirname(filePath);
    const value = await vscode.window.showInputBox({
      title: title,
      value: name,
    });
    if (!value) {
      return false;
    }
    await this.#vfs.rename(filePath, path.join(dirName, value + extname));
    return true;
  }
  async inputBox(filePath: string, title: string) {
    const value = await vscode.window.showInputBox({
      title: title,
      value: filePath,
    });
    if (!value) {
      return;
    }
    return value;
  }
}
