import { inject } from 'static-injector';
import { NodeRunnerBase } from '@shenghuabi/workflow';
import { READ_MIND_NODE_DEFINE } from '../node.define';
import { MindFileService } from '../../../../mind/mind-file.service';

export class ReadMindRunner extends NodeRunnerBase<
  typeof READ_MIND_NODE_DEFINE
> {
  #mindFile = inject(MindFileService);
  override async run() {
    return async (id: string) => {
      const data = await this.#mindFile
        .getFile(this.inputs.fileName)
        .readData();
      if (id === 'tool') {
        return JSON.stringify(data);
      }
      return data;
    };
  }
}
