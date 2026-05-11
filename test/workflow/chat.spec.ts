import { INJECTOR_SCOPE, Injector } from 'static-injector';

import { WorkflowParserService } from '../../src/service/ai/workflow/workflow-parser.service';
import { WorkflowRunnerService } from '../../src/service/ai/workflow/runner/workflow-runner.service';
import { deepEqual, deepStrictEqual, equal, ok } from 'assert';
import { getInjectEnv } from '../test-util/env';
import { DEFAULT_CHAT_SCHEMA_KEY, WorkflowData } from '../../src/share';
import { OpenAITestChat } from '../../src/service/ai/client/chat/vendor/openai-test';
import { RunnerError } from '../../src/service/ai/workflow/runner/runner-error';
import { inspect } from 'util';

describe('工作流:对话', () => {
  // 对话
  function chatWorkflowFactory(config: any = {}) {
    return {
      flow: {
        nodes: [
          {
            position: { x: 425, y: 235 },
            id: '60e96276-373d-4bbb-84b5-363d4454a1ab',
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
                  [
                    {
                      inputType: 'string',
                      value: 'foo',
                      label: 'foo',
                      id: 'f925f785-9a3d-53c2-9e93-2f9ebdd2b66d',
                    },
                  ],
                  [
                    {
                      id: '7864b66d-17a6-5db5-bf81-b4312819ced4',
                      label: 'JsonSchema',
                      value: DEFAULT_CHAT_SCHEMA_KEY,
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
              value: [
                {
                  role: 'system',
                  content: [{ type: 'text', text: '{{foo}}' }],
                },
              ],
              title: '对话',
              config: config,
            },
            width: 300,
            type: 'chat',
            measured: { width: 300, height: 108 },
            selected: true,
          },
        ],
        edges: [],
        viewport: { x: -185, y: -60, zoom: 1 },
      },
      version: 3,
      update: 1733996222096,
    } as Pick<WorkflowData, 'flow'>;
  }
  let injector = getInjectEnv();
  let instance = injector.get(WorkflowParserService);
  let runner = injector.get(WorkflowRunnerService);
  it('基础', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return (input.messages[0].content[0] as any).text;
    };
    let result = await runner.run(resolved.data!, {
      input: new Map([['foo', { value: 'foovalue' }]]),
    });
    equal(result.value, 'foovalue');
  });
  it('yaml格式化正常', async () => {
    let chatData = chatWorkflowFactory({ responseType: 'yaml' });
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return 'value: 1';
    };

    let result = await runner.run(resolved.data!, {
      input: new Map([['foo', { value: '' }]]),
    });
    deepStrictEqual(result.value, { value: 1 });
  });
  it('yaml格式化异常抛出', async () => {
    let chatData = chatWorkflowFactory({ responseType: 'yaml' });
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return '123456';
    };
    try {
      await runner.run(resolved.data!, {
        input: new Map([['foo', { value: '' }]]),
      });
    } catch (error) {
      ok(error instanceof RunnerError);
      ok(inspect(error).includes('yaml'));

      return;
    }
    throw new Error('不应该成功');
  });
  it('markdown格式化正常', async () => {
    let chatData = chatWorkflowFactory({ responseType: 'markdown' });
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return '```markdown\n# test\n```';
    };

    let result = await runner.run(resolved.data!, {
      input: new Map([['foo', { value: '' }]]),
    });
    deepStrictEqual(result.value, `# test`);
  });
  it('json格式化正常', async () => {
    let chatData = chatWorkflowFactory({ responseType: 'json' });
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return JSON.stringify({ a: 1 });
    };

    let result = await runner.run(resolved.data!, {
      input: new Map([['foo', { value: '' }]]),
    });
    deepStrictEqual(result.value, { a: 1 });
  });
  it('json格式化异常抛出', async () => {
    let chatData = chatWorkflowFactory({ responseType: 'json' });
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return '1234';
    };
    try {
      await runner.run(resolved.data!, {
        input: new Map([['foo', { value: '' }]]),
      });
    } catch (error) {
      ok(error instanceof RunnerError);
      ok(inspect(error).includes('json'));

      return;
    }
    throw new Error('不应该成功');
  });
  it('传入JsonSchema正常', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return JSON.stringify({ a: 1 });
    };

    let result = await runner.run(resolved.data!, {
      input: new Map([
        ['foo', { value: '' }],
        [DEFAULT_CHAT_SCHEMA_KEY, { value: { name: '', schema: {} } }],
      ]),
    });
    deepStrictEqual(result.value, { a: 1 });
  });
  it('传入JsonSchema异常', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      return JSON.stringify({ a: 1 });
    };
    try {
      let result = await runner.run(resolved.data!, {
        input: new Map([
          ['foo', { value: '' }],
          [DEFAULT_CHAT_SCHEMA_KEY, { value: {} }],
        ]),
      });
    } catch (error) {
      ok(error instanceof RunnerError);
      ok(inspect(error).includes('JsonSchema'));
      return;
    }
    throw new Error('不应该成功');
  });
  it('json实例格式化', async () => {
    let chatData = chatWorkflowFactory({
      responseType: 'json',
      examples: [
        {
          input: { format: false, value: 'input1' },
          output: { format: true, value: 'value: 1' },
        },
      ],
    });
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      equal(input.messages[2].content, [{ type: 'text', text: `{"value":1}` }]);
      return '{"value":1}';
    };

    let result = await runner.run(resolved.data!, {
      input: new Map([['foo', { value: '' }]]),
    });
  });
  it('json实例格式化(jsonSchema)', async () => {
    let chatData = chatWorkflowFactory({
      examples: [
        {
          input: { format: false, value: 'input1' },
          output: { format: true, value: 'value: 1' },
        },
      ],
    });
    let resolved = instance.parse(chatData);
    OpenAITestChat.ChatResult = (input, options) => {
      equal(input.messages[2].content, [{ type: 'text', text: `{"value":1}` }]);
      return '{"value":1}';
    };

    let result = await runner.run(resolved.data!, {
      input: new Map([
        ['foo', { value: '' }],
        [DEFAULT_CHAT_SCHEMA_KEY, { value: { name: '', schema: {} } }],
      ]),
    });
  });
});
