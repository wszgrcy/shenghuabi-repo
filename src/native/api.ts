import * as vscode from 'vscode';

export const SHB_NATIVE = (vscode as any).shenghuabi as {
  $call: (id: string, args?: any) => Promise<any>;
};
