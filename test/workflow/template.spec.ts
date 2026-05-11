import { INJECTOR_SCOPE, Injector } from 'static-injector';

import { WorkflowParserService } from '../../src/service/ai/workflow/workflow-parser.service';
import { WorkflowRunnerService } from '../../src/service/ai/workflow/runner/workflow-runner.service';
import { deepEqual, deepStrictEqual, equal, ok } from 'assert';
import { getInjectEnv } from '../test-util/env';
import { DEFAULT_CHAT_SCHEMA_KEY, WorkflowData } from '../../src/share';
import { OpenAITestChat } from '../../src/service/ai/client/chat/vendor/openai-test';
import { RunnerError } from '../../src/service/ai/workflow/runner/runner-error';
import { inspect } from 'util';

describe('工作流:模板', () => {
  // 对话
  function chatWorkflowFactory(
    config: any = {
      type: 'card',
      define: {
        type: 'card',
        title: '{{标题}}',
        content: '{{内容}}',
      },
    },
  ) {
    return {
      flow: {
        nodes: [
          {
            position: { x: 845, y: 415 },
            id: '8227b358-e092-48f6-9172-7af927cdd49b',
            data: {
              transform: { resizable: true },
              handle: {
                input: [
                  [],
                  [],
                  [
                    {
                      id: '63be22c6-c6f9-5e07-8f4f-81f16d3b9bf7',
                      label: '标题',
                      value: '标题',
                    },
                    {
                      id: '11965c20-4a47-5828-b3b5-a64e3bf3c15b',
                      label: '内容',
                      value: '内容',
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
              title: '模板',
              config: config,
            },
            width: 300,
            type: 'template',
            measured: { width: 300, height: 192 },
            selected: true,
          },
        ],
        edges: [],
        viewport: {
          x: -335.8458922639843,
          y: -123.19007049211189,
          zoom: 0.7937005332711145,
        },
      },
      version: 3,
      update: 1734069186335,
    } as Pick<WorkflowData, 'flow'>;
  }
  let injector = getInjectEnv();
  let instance = injector.get(WorkflowParserService);
  let runner = injector.get(WorkflowRunnerService);
  it('卡片', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);

    let result = await runner.run(resolved.data!, {
      input: new Map([
        ['标题', { value: 'title' }],
        ['内容', { value: 'content' }],
      ]),
    });
    deepStrictEqual(result.value, {
      type: 'card',
      title: 'title',
      content: 'content',
    });
  });
  it('文本', async () => {
    let chatData = chatWorkflowFactory({
      type: 'text',
      define: {
        type: 'text',
        content: '{{内容}}',
      },
    });
    let resolved = instance.parse(chatData);

    let result = await runner.run(resolved.data!, {
      input: new Map([
        ['标题', { value: 'title' }],
        ['内容', { value: 'content' }],
      ]),
    });
    deepStrictEqual(result.value, {
      type: 'text',
      content: 'content',
    });
  });
});
