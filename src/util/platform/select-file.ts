import * as vscode from 'vscode';

export async function selectFile<MULTI extends boolean = false>(
  title: string,
  multi: MULTI = false as MULTI,
  filters?:
    | {
        [name: string]: string[];
      }
    | undefined,
): Promise<
  MULTI extends true ? vscode.Uri[] | undefined : vscode.Uri | undefined
> {
  const list = await vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectFolders: false,
    canSelectMany: multi,
    title: title,
    openLabel: '选择',
    filters,
  });
  return multi ? (list as any) : (list?.[0] as any);
}
export async function selectFolder<MULTI extends boolean = false>(
  title: string,
  multi: MULTI = false as MULTI,
  filters?:
    | {
        [name: string]: string[];
      }
    | undefined,
): Promise<
  MULTI extends true ? vscode.Uri[] | undefined : vscode.Uri | undefined
> {
  const list = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: multi,
    title: title,
    openLabel: '选择',
    filters,
  });
  return multi ? (list as any) : (list?.[0] as any);
}
