import * as vscode from 'vscode';
import { RootStaticInjectOptions } from 'static-injector';
import { Observable, shareReplay } from 'rxjs';

export class EventService extends RootStaticInjectOptions {
  textChange$$ = new Observable<vscode.TextDocumentChangeEvent>((ob) => {
    vscode.workspace.onDidChangeTextDocument((res) => {
      ob.next(res);
    });
  }).pipe(shareReplay(1));
  beforeSave$$ = new Observable<vscode.TextDocumentWillSaveEvent>((ob) => {
    vscode.workspace.onWillSaveTextDocument((e) => {
      ob.next(e);
    });
  });
}
