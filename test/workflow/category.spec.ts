import { INJECTOR_SCOPE, Injector } from 'static-injector';

import { WorkflowParserService } from '../../src/service/ai/workflow/workflow-parser.service';
import { WorkflowRunnerService } from '../../src/service/ai/workflow/runner/workflow-runner.service';
import { deepEqual, deepStrictEqual, equal, ok } from 'assert';
import { getInjectEnv } from '../test-util/env';
import { DEFAULT_CHAT_SCHEMA_KEY, WorkflowData } from '../../src/share';
import { OpenAITestChat } from '../../src/service/ai/client/chat/vendor/openai-test';
import { RunnerError } from '../../src/service/ai/workflow/runner/runner-error';
import { inspect } from 'util';

describe('工作流:分类', () => {
  // 对话
  function chatWorkflowFactory(config: any = {}) {
    return {
      flow: {
        nodes: [
          {
            position: { x: 615, y: 105 },
            id: 'b132379d-c860-49b5-a48f-c7d3593d057c',
            data: {
              transform: { resizable: true },
              handle: {
                input: [
                  [
                    {
                      id: '79cce85d-1231-56fa-9afb-afb06b1c5b53',
                      label: '[连接点]',
                      value: '[连接点]',
                      type: 'connect',
                    },
                  ],
                  null,
                  [
                    {
                      inputType: 'string',
                      value: 'category1',
                      label: 'category1',
                      id: '65f7f18f-ae22-50e6-846b-4c63c5f12ba6',
                    },
                  ],
                ],
                output: [
                  [
                    {
                      value: '{{category1}}',
                      label: '{{category1}}',
                      id: '2f592821-6c60-5e9e-998d-9c0a475a5fd5',
                    },
                  ],
                  [
                    {
                      id: '7843d4fb-054c-5c2c-9d2d-58fb0bb1979e',
                      label: '否则',
                      value: 'else',
                    },
                  ],
                ],
              },
              title: '分类器',
              config: {
                json: false,
                categories: [{ value: '{{category1}}' }],
                examples: [
                  {
                    input: {
                      value:
                        'categories:\n  - 与请客相关的问题\n  - 与斩首相关的问题\n  - 与收下当狗相关的问题\n  - 其他问题\ninput_text: 今天有空去我家吃点？\n',
                      format: false,
                    },
                    output: {
                      value: 'category_name: 与请客相关的问题\n',
                      format: false,
                    },
                  },
                  {
                    input: {
                      value:
                        'categories:\n  - 高兴\n  - 愤怒\n  - 抱怨\ninput_text: 我再也不去这家店买东西了，他家的服务真差\n',
                      format: false,
                    },
                    output: { value: 'category_name: 愤怒\n', format: false },
                  },
                ],
              },
              value:
                '###职位描述\n您是一个文本分类引擎，可以分析文本数据并根据用户输入自动确定的类别分配类别。\n###任务\n您的任务是为输入文本分配一个类别，并且只能在输出中返回一个类别。此外，您需要从文本中提取与分类相关的关键字。\n###格式\n输入文本位于input_text字段中。类别位于categories数组字段中，在类别中有两个字段category_id和category_name。\n###约束条件\n不要在响应中包含JSON数组以外的任何内容。',
            },
            width: 300,
            type: 'category',
            measured: { width: 300, height: 808 },
            selected: false,
            dragging: false,
            className: '',
          },
          {
            position: { x: 1150, y: 390 },
            id: '3258f6cc-d980-4a2b-ae00-2de78eed0dae',
            data: {
              transform: { resizable: true },
              handle: {
                input: [
                  [
                    {
                      id: '79cce85d-1231-56fa-9afb-afb06b1c5b53',
                      label: '[连接点]',
                      value: '[连接点]',
                      type: 'connect',
                    },
                  ],
                  [],
                ],
                output: [
                  [
                    {
                      id: 'cadc4460-717a-5622-84c3-05010d832f13',
                      label: '输出',
                      value: 'default',
                    },
                  ],
                ],
              },
              value: '111',
              title: '文本模板',
            },
            width: 300,
            type: 'textarea',
            measured: { width: 300, height: 108 },
            selected: false,
          },
          {
            position: { x: 1190, y: 670 },
            id: 'd7da5731-f3b3-4434-bcb8-9c11fe307f3a',
            data: {
              transform: { resizable: true },
              handle: {
                input: [
                  [
                    {
                      id: '79cce85d-1231-56fa-9afb-afb06b1c5b53',
                      label: '[连接点]',
                      value: '[连接点]',
                      type: 'connect',
                    },
                  ],
                  [],
                ],
                output: [
                  [
                    {
                      id: 'cadc4460-717a-5622-84c3-05010d832f13',
                      label: '输出',
                      value: 'default',
                    },
                  ],
                ],
              },
              value: '222',
              title: '文本模板',
            },
            width: 300,
            type: 'textarea',
            measured: { width: 300, height: 108 },
            selected: true,
          },
        ],
        edges: [
          {
            source: 'b132379d-c860-49b5-a48f-c7d3593d057c',
            sourceHandle: '2f592821-6c60-5e9e-998d-9c0a475a5fd5',
            target: '3258f6cc-d980-4a2b-ae00-2de78eed0dae',
            targetHandle: '79cce85d-1231-56fa-9afb-afb06b1c5b53',
            id: 'xy-edge__b132379d-c860-49b5-a48f-c7d3593d057c2f592821-6c60-5e9e-998d-9c0a475a5fd5-3258f6cc-d980-4a2b-ae00-2de78eed0dae79cce85d-1231-56fa-9afb-afb06b1c5b53',
          },
          {
            source: 'b132379d-c860-49b5-a48f-c7d3593d057c',
            sourceHandle: '7843d4fb-054c-5c2c-9d2d-58fb0bb1979e',
            target: 'd7da5731-f3b3-4434-bcb8-9c11fe307f3a',
            targetHandle: '79cce85d-1231-56fa-9afb-afb06b1c5b53',
            id: 'xy-edge__b132379d-c860-49b5-a48f-c7d3593d057c7843d4fb-054c-5c2c-9d2d-58fb0bb1979e-d7da5731-f3b3-4434-bcb8-9c11fe307f3a79cce85d-1231-56fa-9afb-afb06b1c5b53',
          },
        ],
        viewport: {
          x: -175.68199108919976,
          y: 5.847713135246977,
          zoom: 0.5612310370364315,
        },
      },
      version: 3,
      update: 1734066460878,
    } as Pick<WorkflowData, 'flow'>;
  }
  let injector = getInjectEnv();
  let instance = injector.get(WorkflowParserService);
  let runner = injector.get(WorkflowRunnerService);
  it('分类1', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      let data = JSON.parse(input.messages.at(-1)![1] as any);
      let content = data.categories[0];
      return JSON.stringify(content);
    };
    let result = await runner.run(resolved.data!, {
      input: new Map([['category1', { value: 'test1' }]]),
    });
    equal(result.value, '111');
  });
  it('其他', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return '123';
    };
    let result = await runner.run(resolved.data!, {
      input: new Map([['category1', { value: 'test1' }]]),
    });
    equal(result.value, '222');
  });
});
