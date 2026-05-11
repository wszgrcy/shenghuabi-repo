import { INJECTOR_SCOPE, Injector } from 'static-injector';
import { WorkflowParserService } from '../../src/service/ai/workflow/workflow-parser.service';
import { WorkflowRunnerService } from '../../src/service/ai/workflow/runner/workflow-runner.service';
import { deepEqual, deepStrictEqual, equal, ok } from 'assert';
import { getInjectEnv } from '../test-util/env';
import { DEFAULT_CHAT_SCHEMA_KEY, WorkflowData } from '../../src/share';
import { OpenAITestChat } from '../../src/service/ai/client/chat/vendor/openai-test';
import { RunnerError } from '../../src/service/ai/workflow/runner/runner-error';

describe('工作流:数组合并', () => {
  // 对话
  function chatWorkflowFactory(config: any = {}) {
    return {
      flow: {
        nodes: [
          {
            position: { x: 500, y: 310 },
            id: '788bdc47-4b67-493e-9f45-da13aca9b6e4',
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
              value: [],
              title: '格式定义',
              config: { level: 999 },
            },
            width: 300,
            type: 'array-merge',
            measured: { width: 300, height: 98 },
            className: '',
          },
          {
            position: { x: 85, y: 300 },
            id: '4e982679-d4d1-41b2-b834-053751308ce8',
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
                  [],
                ],
              },
              value:
                'return async (outputName: string) => {\n    return { value: [[1,2],[3,4]], extra: undefined }\n  }',
              title: '代码',
              config: {},
              input: [],
              output: [],
            },
            width: 300,
            type: 'script',
            measured: { width: 300, height: 136 },
            selected: true,
            dragging: false,
            className: '',
          },
        ],
        edges: [
          {
            source: '4e982679-d4d1-41b2-b834-053751308ce8',
            sourceHandle: 'cadc4460-717a-5622-84c3-05010d832f13',
            target: '788bdc47-4b67-493e-9f45-da13aca9b6e4',
            targetHandle: '79cce85d-1231-56fa-9afb-afb06b1c5b53',
            id: 'xy-edge__4e982679-d4d1-41b2-b834-053751308ce8cadc4460-717a-5622-84c3-05010d832f13-788bdc47-4b67-493e-9f45-da13aca9b6e479cce85d-1231-56fa-9afb-afb06b1c5b53',
          },
        ],
        viewport: {
          x: 8.081036350293232,
          y: -119.34956492027732,
          zoom: 0.9999999999999998,
        },
      },
      version: 3,
      update: 1734051752366,
    } as Pick<WorkflowData, 'flow'>;
  }
  let injector = getInjectEnv();
  let instance = injector.get(WorkflowParserService);
  let runner = injector.get(WorkflowRunnerService);
  it('基础', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return (input.messages[0][1][0] as any).text;
    };
    let result = await runner.run(resolved.data!, {
      input: new Map(),
    });
    deepStrictEqual(result.value, [1, 2, 3, 4]);
  });
});
