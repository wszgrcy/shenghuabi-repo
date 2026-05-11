import { inject } from 'static-injector';
import { WorkflowExecService } from '@shenghuabi/workflow';
import { WorkflowSelectService } from '@shenghuabi/workflow';
import { OriginConfigToken } from '../../../knowledge/token';
import {
  EntityExtraDefine,
  FileChunkPayload,
} from '@shenghuabi/knowledge/knowledge';
import * as v from 'valibot';
import { captureException } from '@sentry/node';
export class RagWorkflowParser {
  #options = inject(OriginConfigToken);
  #workflowExec = inject(WorkflowExecService);
  #workflow = inject(WorkflowSelectService);
  //todo 可以返回实例,然后检测更新
  #resolvedWorkflow$$ = () => {
    return this.#workflow
      .get({ workflowName: this.#options().extractWorkflow! })
      .then(async (data) => {
        const result = this.#workflowExec.parse(data);
        // todo 测试下异常是否能抛出
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result.data!;
      });
  };
  // todo 检查传入是不是chunk/content
  async parse(document: FileChunkPayload, signal?: AbortSignal) {
    const times = Math.max(0, this.#options().extractRetry ?? 0) + 1;
    for (let index = 0; index < times; index++) {
      let result;
      try {
        const data = await this.#resolvedWorkflow$$();
        result = await this.#workflowExec.runParse(
          data,
          {
            input: {},
            environmentParameters: {
              chunk: document.chunk,
              fileName: document.fileName,
              entityTypeList: this.#options().entityTypeList,
            },
          },
          undefined,
          signal,
        );
      } catch (error) {
        if (times - index === 1) {
          captureException(error);
          throw error;
        }
      }
      try {
        return v.parse(EntityExtraDefine, result!.value);
      } catch (error) {
        if (times - index === 1) {
          captureException(error);
          throw error;
        }
      }
    }
    throw '';
  }
}
