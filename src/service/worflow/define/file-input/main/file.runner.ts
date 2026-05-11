import { inject } from 'static-injector';

import { NodeRunnerBase } from '@shenghuabi/workflow';
import { WorkspaceService } from '../../../../workspace.service';

import { ChatContextType } from '../../../../../share';
import { WorkflowExtraMetadata } from '@shenghuabi/workflow';
import * as v from 'valibot';
import { FILE_NODE_DEFINE } from '../file.node.define';
import { FileParserService } from '@shenghuabi/knowledge/file-parser';
import { dynamicInject } from '../../../../../token';

export type WorkflowFileExtraMetadata = WorkflowExtraMetadata & {
  filePath: string;
};
/** 读文件 */
export class FileRunner extends NodeRunnerBase {
  #workspace = inject(WorkspaceService);
  #vfs = this.#workspace.rootVfs;
  #fileParser$$ = dynamicInject(FileParserService);
  override async run() {
    const nodeResult = v.parse(FILE_NODE_DEFINE, this.node);
    const list = nodeResult.data.value;
    const config = nodeResult.data.config!;

    const newList: string[][] = [];
    const extraList: WorkflowFileExtraMetadata[][] = [];
    for (let i = 0; i < list.length; i++) {
      const filePath = this.#workspace.formatPath(list[i]);
      const content = await this.#vfs.read(filePath);
      if (config.splitPages) {
        const result = await this.#fileParser$$().parse(
          filePath,
          content as any,
        );
        if (result) {
          newList[i] ??= [];
          extraList[i] ??= [];
          for (const item of result) {
            newList[i].push(item.content);
            extraList[i].push({
              metadata: {
                type: ChatContextType.file,
                description: filePath,
                tooltip: `标题:${item.title}`,
              },
              filePath: filePath,
            });
          }
        }
      } else {
        const result = await this.#fileParser$$().parseOne(
          filePath,
          content as any,
        );
        if (result.content) {
          newList.push([result.content]);
          extraList.push([
            {
              metadata: { description: filePath, type: ChatContextType.file },
              filePath: filePath,
            },
          ]);
        }
      }
    }
    //文件没有切片?
    return async (outputName: string) => {
      if (outputName === 'first') {
        return {
          value: newList[0][0],
          extra: extraList[0][0],
        };
      } else if (outputName === 'flat') {
        return {
          value: newList.flat(),
          extra: extraList.flat(),
        };
      }

      if (newList.length > 1 || config.alwaysArray) {
        return {
          value: newList,
          extra: extraList,
        };
      } else {
        return {
          value: newList[0][0],
          extra: extraList[0][0],
        };
      }
    };
  }
}
