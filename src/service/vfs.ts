import { Observable, catchError, from, map, of, switchMap } from 'rxjs';
import * as vscode from 'vscode';

// vscode的vfs实现
export class ReadOnlyVFS implements virtualFs.ReadonlyHost {
  #rootPath?;
  constructor(rootPath?: string) {
    if (rootPath) {
      this.#rootPath = rootPath;
    }
  }
  protected resolve(path: Path) {
    if (this.#rootPath) {
      return resolve(this.#rootPath, path);
    }
    return path;
  }

  capabilities: virtualFs.HostCapabilities = { synchronous: false };
  read(path: Path): Observable<ArrayBuffer> {
    const textDocument = this.findTextDocument(path);
    return textDocument
      ? of(textDocument.getText())
      : from(
          vscode.workspace.fs
            .readFile(vscode.Uri.file(this.resolve(path)))
            .then((result) => result.buffer),
        );
  }
  list(path: Path): Observable<PathFragment[]> {
    return this.exists(path)
      .pipe(
        switchMap((result) =>
          result
            ? vscode.workspace.fs
                .readDirectory(vscode.Uri.file(this.resolve(path)))
                .then((file) => file.map(([value]) => value as PathFragment))
            : of([]),
        ),
      )
      .pipe(catchError(() => []));
  }
  exists(path: Path): Observable<boolean> {
    return from(
      vscode.workspace.fs.stat(vscode.Uri.file(this.resolve(path))),
    ).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
  isDirectory(path: Path): Observable<boolean> {
    return from(
      vscode.workspace.fs.stat(vscode.Uri.file(this.resolve(path))),
    ).pipe(
      map((result) => result.type === vscode.FileType.Directory),
      catchError(() => of(false)),
    );
  }
  isFile(path: Path): Observable<boolean> {
    return from(
      vscode.workspace.fs.stat(vscode.Uri.file(this.resolve(path))),
    ).pipe(
      map((result) => result.type === vscode.FileType.File),
      catchError(() => of(false)),
    );
  }
  stat(path: Path): Observable<{
    isFile(): boolean;
    isDirectory(): boolean;
    readonly size: number;
    readonly atime: Date;
    readonly mtime: Date;
    readonly ctime: Date;
    readonly birthtime: Date;
  } | null> | null {
    return from(
      vscode.workspace.fs.stat(vscode.Uri.file(this.resolve(path))),
    ).pipe(
      map((item) => ({
        isFile: () => item.type === vscode.FileType.File,
        isDirectory: () => item.type === vscode.FileType.Directory,
        size: item.size,
        atime: new Date(item.ctime),
        mtime: new Date(item.mtime),
        ctime: new Date(item.ctime),
        birthtime: new Date(item.ctime),
      })),
      catchError(() => of(null)),
    );
  }
  protected get textDocuments() {
    return vscode.workspace.textDocuments;
  }

  protected findTextDocument(path: Path) {
    for (const item of this.textDocuments) {
      if (item.uri.scheme !== 'file') {
        continue;
      }
      const itemPath = item.uri.fsPath;
      if (itemPath === path) {
        return item;
      }
    }
    return undefined;
  }
}

export class VSCodeHost extends ReadOnlyVFS implements virtualFs.Host {
  write(path: Path, content: ArrayBufferLike): Observable<void> {
    const textDocument = this.findTextDocument(path);
    if (textDocument) {
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.replace(
        textDocument.uri,
        new vscode.Range(
          textDocument!.positionAt(0),
          textDocument!.positionAt(textDocument!.getText().length),
        ),
        content,
      );
      return from(
        vscode.workspace.applyEdit(workspaceEdit) as any as Promise<void>,
      );
    }
    return of(path).pipe(
      switchMap(() => {
        return vscode.workspace.fs.writeFile(
          vscode.Uri.file(this.resolve(path)),
          new Uint8Array(content),
        );
      }),
    );
  }
  delete(path: Path): Observable<void> {
    return from(
      vscode.workspace.fs.delete(vscode.Uri.file(this.resolve(path)), {
        recursive: true,
        useTrash: true,
      }),
    );
  }
  rename(fromPath: Path, to: Path): Observable<void> {
    const textDocument = this.findTextDocument(fromPath);
    return (
      textDocument
        ? from(textDocument.save() as unknown as Promise<undefined>)
        : of(undefined)
    ).pipe(
      switchMap(() =>
        from(
          vscode.workspace.fs.rename(
            vscode.Uri.file(this.resolve(fromPath)),
            vscode.Uri.file(this.resolve(to)),
          ),
        ),
      ),
    );
  }
  watch(
    path: Path,
    options?: virtualFs.HostWatchOptions | undefined,
  ): Observable<virtualFs.HostWatchEvent> | null {
    throw new Error('Method not implemented.');
  }
}
