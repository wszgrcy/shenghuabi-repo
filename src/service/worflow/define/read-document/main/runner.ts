import { inject } from 'static-injector';
import { NodeRunnerBase } from '@shenghuabi/workflow';
import { READ_DOCUMENT_NODE_DEFINE } from '../node.define';
import { FileParserService } from '@shenghuabi/knowledge/file-parser';
import fs from 'node:fs';
import { path } from '@cyia/vfs2';
import { WorkspaceService } from '../../../../workspace.service';
import { MindFileService } from '../../../../mind/mind-file.service';

export class ReadDocumentRunner extends NodeRunnerBase<
  typeof READ_DOCUMENT_NODE_DEFINE
> {
  #fileParser = inject(FileParserService);
  #workspace = inject(WorkspaceService);
  #mindFile = inject(MindFileService);

  override async run() {
    return async (id: string) => {
      let content;
      if (
        this.inputs.filePath.endsWith('.naotu') ||
        this.inputs.filePath.endsWith('.nt')
      ) {
        content = await this.#mindFile.getFile(this.inputs.filePath).readData();
        if (id === 'tool') {
          return JSON.stringify(content);
        }
      }
      let buffer = await fs.promises.readFile(
        path.resolve(this.#workspace.nFolder(), this.inputs.filePath),
      );
      content = this.#fileParser.parseOne(this.inputs.filePath, buffer);
      if (id === 'tool') {
        return (await content).content;
      }
      return content;
    };
  }
}
