import { INJECTOR_SCOPE, Injector } from 'static-injector';

import { WorkflowParserService } from '../../src/service/ai/workflow/workflow-parser.service';
import { WorkflowRunnerService } from '../../src/service/ai/workflow/runner/workflow-runner.service';
import { deepEqual, deepStrictEqual, equal, ok } from 'assert';
import { getInjectEnv } from '../test-util/env';
import {
  deepClone,
  DEFAULT_CHAT_SCHEMA_KEY,
  WorkflowData,
} from '../../src/share';
import { OpenAITestChat } from '../../src/service/ai/client/chat/vendor/openai-test';
import { RunnerError } from '../../src/service/ai/workflow/runner/runner-error';

describe('工作流:数组合并', () => {
  // 对话
  function chatWorkflowFactory(config: any = {}) {
    return {
      flow: {
        nodes: [
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
                'return async (outputName: string) => {\n    return { value: [[1,2],[3,4]], extra: [{test:0},{test:1}] }\n  }',
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
          {
            position: { x: 565, y: 590 },
            id: '915f0813-1eb0-4b55-910f-29208cb017c2',
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
                  [
                    {
                      id: 'c7e86e78-fcb4-5c93-87b7-63fb3a0b4093',
                      label: '扁平数组',
                      value: 'flat',
                    },
                  ],
                ],
              },
              value: [],
              title: '迭代',
            },
            width: 496,
            height: 316,
            type: 'iteration',
            measured: { width: 496, height: 316 },
          },
          {
            position: { x: 15, y: 150 },
            id: '0c7569b9-cd0a-427c-a1a5-1fe37ac6f783',
            data: {
              transform: { resizable: true },
              handle: {
                input: [],
                output: [
                  [
                    {
                      id: 'cadc4460-717a-5622-84c3-05010d832f13',
                      label: '迭代项',
                      value: 'default',
                    },
                  ],
                ],
              },
              title: '',
            },
            draggable: false,
            style: {},
            type: 'iteration-start',
            extent: 'parent',
            parentId: '915f0813-1eb0-4b55-910f-29208cb017c2',
            measured: { width: 56, height: 61 },
          },
        ],
        edges: [
          {
            source: '4e982679-d4d1-41b2-b834-053751308ce8',
            sourceHandle: 'cadc4460-717a-5622-84c3-05010d832f13',
            target: '915f0813-1eb0-4b55-910f-29208cb017c2',
            targetHandle: '79cce85d-1231-56fa-9afb-afb06b1c5b53',

            id: 'xy-edge__4e982679-d4d1-41b2-b834-053751308ce8cadc4460-717a-5622-84c3-05010d832f13-915f0813-1eb0-4b55-910f-29208cb017c279cce85d-1231-56fa-9afb-afb06b1c5b53',
          },
        ],
        viewport: {
          x: 11.777838645136399,
          y: -133.98767386066856,
          zoom: 0.7071067909245367,
        },
      },
      version: 3,
      update: 1734053785793,
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
    deepStrictEqual(deepClone(result.value), [
      [1, 2],
      [3, 4],
    ]);
    deepStrictEqual(deepClone(result.extra), [{ test: 0 }, { test: 1 }]);
  });
});
