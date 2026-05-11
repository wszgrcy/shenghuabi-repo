import { deepEqual, deepStrictEqual, equal, ok } from 'assert';
import { OpenAITestChat } from '../../../src/service/ai/client/chat/vendor/openai-test';
import { WorkflowRunnerService } from '../../../src/service/ai/workflow/runner/workflow-runner.service';
import { WorkflowParserService } from '../../../src/service/ai/workflow/workflow-parser.service';
import { RUNNER_ORIGIN_OUTPUT_KEY, WorkflowData } from '../../../src/share';
import { getInjectEnv } from '../../test-util/env';
import { toV6 } from '../../../src/share/workflow/mirgrate/v6';

describe('工作流:v6迁移', () => {
  // 对话
  function chatWorkflowFactory(config: any = {}) {
    return {
      flow: {
        nodes: [
          {
            position: { x: 230, y: 225 },
            id: 'd05aef6a-4024-414c-8f21-c1f1dda7e743',
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
                  [
                    {
                      id: '7180a96d-8b27-5622-96fa-df424852d22a',
                      label: 'JsonSchema',
                      value: '[JsonSchema]',
                      inputType: 'schema',
                      optional: true,
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
              value: [{ type: 'user', content: '返回一个疑问句' }],
              title: '对话',
              config: { responseType: 'json' },
            },
            width: 300,
            type: 'chat',
            measured: { width: 300, height: 108 },
            selected: false,
          },
        ],
        edges: [],
        viewport: { x: -238, y: -25, zoom: 1 },
      },
      version: 5,
      update: 1734229070985,
    } as Pick<WorkflowData, 'flow'>;
  }
  let injector = getInjectEnv();
  let instance = injector.get(WorkflowParserService);
  let runner = injector.get(WorkflowRunnerService);
  it('基础', async () => {
    let chatData = chatWorkflowFactory();
    let updated = toV6(chatData.flow);
    for (const item of updated.nodes) {
      if (item.type === 'chat') {
        equal(item.data.handle?.output.length, 2);
        equal(item.data.handle?.output[1][0].value, RUNNER_ORIGIN_OUTPUT_KEY);
      }
    }
    let resolved = instance.parse({ flow: updated });
    OpenAITestChat.ChatResult = (input, options) => {
      return JSON.stringify({ value: 1 });
    };
    let result = await runner.run(resolved.data!, {
      input: new Map([]),
    });
    deepStrictEqual(result.value, { value: 1 });
  });
  it('原始出口', async () => {
    let chatData = chatWorkflowFactory();
    let updated = toV6(chatData.flow);
    for (const item of updated.nodes) {
      if (item.type === 'chat') {
        equal(item.data.handle?.output.length, 2);
        equal(item.data.handle?.output[1][0].value, RUNNER_ORIGIN_OUTPUT_KEY);
        item.data.outputName = RUNNER_ORIGIN_OUTPUT_KEY;
      }
    }
    let resolved = instance.parse({ flow: updated });
    OpenAITestChat.ChatResult = (input, options) => {
      return JSON.stringify({ value: 1 });
    };
    let result = await runner.run(resolved.data!, {
      input: new Map([]),
    });
    deepStrictEqual(result.value, JSON.stringify({ value: 1 }));
  });
});
