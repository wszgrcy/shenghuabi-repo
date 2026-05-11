import { inject } from 'static-injector';

import { NodeRunnerBase } from '@shenghuabi/workflow';
import { WorkflowRunnerService } from '@shenghuabi/workflow';

import { parse } from 'yaml';
import { v4 } from 'uuid';
import { ChatService } from '../../../../ai/chat.service';

import { ChatMessageListOutputType } from '@shenghuabi/openai';
import { AbortSignalToken } from '@shenghuabi/workflow';
import { TemplateFormatService } from '@shenghuabi/workflow';
import { jsonParse } from '../../../../ai/util/json-parser';
import * as v from 'valibot';
import { CATEGORY_NODE_DEFINE } from '../webview/category.node.define';

export class CategoryRunner extends NodeRunnerBase {
  #chatService = inject(ChatService);
  #abort = inject(AbortSignalToken);
  #format = inject(TemplateFormatService);

  override async run() {
    const obj = this.inputValueObject$$();
    // 连接点
    const data = this.inputParams.get(this.node.inputs[0].value)!;
    const nodeResult = v.parse(CATEGORY_NODE_DEFINE, this.node);

    const config = nodeResult.data.config!;
    const inputList = config.categories.map((item) => {
      return {
        category_id: v4().slice(0, 13),
        category_name: this.#format.interpolate(item.value, obj),
      };
    });
    // 返回显示问题
    /** 系统提示词 */
    const value = this.node.data.value!;
    const templatePrompt = [
      { role: 'system', content: [{ type: 'text', text: value }] },
      ...config.examples
        .filter((item) => item.input.value && item.output.value)
        .flatMap((item) => {
          const input = parse(item.input.value);
          const output = parse(item.output.value);
          const obj = {
            categories: input.categories.map((item: string) => {
              return { category_id: v4().slice(0, 13), category_name: item };
            }) as any[],
            input_text: input.input_text,
          };
          const selectItem = obj.categories.find(
            (item: any) => item.category_name === output.category_name,
          );
          return [
            {
              role: 'user',
              content: [{ type: 'text', text: JSON.stringify(obj) }],
            },
            {
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    ...output,
                    category_id: selectItem.category_id,
                  }),
                },
              ],
            },
          ] as ChatMessageListOutputType;
        }),
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              categories: inputList,
              input_text: data.value,
            }),
          },
        ],
      },
    ] as ChatMessageListOutputType;
    const llm = await this.#chatService.chat(this.mergeChatModel(config.llm));
    const result = await llm.chat(
      {
        messages: templatePrompt,
        response_format: { type: 'json_object' },
      },
      { signal: this.#abort },
    );

    const resultContent = result.content;
    const jsonResult = jsonParse(resultContent);
    const index = inputList.findIndex(
      (item) =>
        jsonResult?.['category_name'] === item.category_name ||
        jsonResult?.['category_id'] === item.category_id,
    );
    const subFlow =
      this.node.subFlowList![index] || this.node.subFlowList!.at(-1);
    if (!subFlow) {
      throw new Error('未找到匹配分类');
    }
    const newInputs = new Map(this.inputParams);

    const subResult = await this.injector
      .get(WorkflowRunnerService)
      .createContext(subFlow.flow, newInputs, this.context, this.injector)
      .run();
    return async () => {
      return subResult;
    };
  }
}
