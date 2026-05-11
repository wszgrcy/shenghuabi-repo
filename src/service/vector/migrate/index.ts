import { Injector } from 'static-injector';
import { getDefaults } from '@piying/view-angular-core';
import {
  KnowledgeFileDefine,
  KnowledgeFileType,
} from '../../../share/define/knowledge/working-knowledge';
import * as vscode from 'vscode';
// todo 未来可能要用
export async function knowledgeMigrate(
  input: any,
  injector: Injector,
): Promise<{ value: KnowledgeFileType; update: boolean }> {
  const update = false;
  if (!input) {
    return { update, value: getDefaults(KnowledgeFileDefine) };
  } else {
    if (input.version < 4) {
      vscode.window.showWarningMessage('知识库版本过低,请使用迁移版本升级');
      await new Promise(() => {});
    }
  }
  // if (!input.version) {
  //   update = true;
  //   try {
  //   } catch (error) {
  //     throw new Error(`知识库v2迁移失败:${errorFormat(error)}`);
  //   }
  // }
  return { update, value: input };
}
