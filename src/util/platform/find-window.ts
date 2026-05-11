import * as vscode from 'vscode';

export async function findWindow(
  findFn: (item: vscode.Tab) => Promise<boolean>,
) {
  for (const tabGroup of vscode.window.tabGroups.all) {
    for (const tab of tabGroup.tabs) {
      if (await findFn(tab)) {
        return tab;
      }
    }
  }
  return undefined;
}
