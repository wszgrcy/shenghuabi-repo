import * as v from 'valibot';
import * as vscode from 'vscode';
export const REPLACE_SELECT_STRING_NODE_DEFINE = v.object({
  // filePath: v.pipe(v.string()),
  selection: v.pipe(v.string(), v.title('选中内容')),
  replace: v.pipe(v.string(), v.title('替换内容')),
});
