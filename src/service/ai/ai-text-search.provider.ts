import { inject, RootStaticInjectOptions } from 'static-injector';
import {
  AITextSearchProvider,
  CancellationToken,
  Progress,
  TextSearchComplete2,
  TextSearchProviderOptions,
  TextSearchResult2,
} from 'vscode';
import { DocumentVectorService } from '../vector-query/document-vector.service';
import * as vscode from 'vscode';
import { WorkspaceService } from '../workspace.service';
import { path } from '@cyia/vfs2';
// 依赖工作区
export class CustomAITextSearchProvider
  extends RootStaticInjectOptions
  implements AITextSearchProvider
{
  static readonly scheme = 'file';
  name = '文本嵌入';
  #document = inject(DocumentVectorService);
  #workspace = inject(WorkspaceService);
  async provideAITextSearchResults(
    query: string,
    options: TextSearchProviderOptions,
    progress: Progress<TextSearchResult2>,
    token: CancellationToken,
  ): Promise<TextSearchComplete2 | null | undefined> {
    const result = (await this.#document.aiSearch(
      query,
      options.folderOptions[0].includes,
      options.folderOptions[0].excludes.filter(
        (item) => typeof item === 'string',
      ) as any,
    ))!;

    for (const groupList of result) {
      progress.report(
        new vscode.TextSearchMatch2(
          vscode.Uri.file(
            path.join(this.#workspace.nFolder(), groupList[0].fullName),
          ),
          groupList.map((item) => ({
            sourceRange: new vscode.Range(
              new vscode.Position(item.loc.lines.from - 1, 0),
              new vscode.Position(item.loc.lines.to, 0),
            ),
            previewRange: new vscode.Range(
              new vscode.Position(0, 0),
              new vscode.Position(1, 0),
            ),
          })),
          groupList[0].chunk,
        ),
      );
    }
    return { limitHit: false };
  }
}
