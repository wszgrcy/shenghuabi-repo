
import { WorkflowParserService } from '../../src/service/ai/workflow/workflow-parser.service';
import { WorkflowRunnerService } from '../../src/service/ai/workflow/runner/workflow-runner.service';
import { deepEqual, deepStrictEqual, equal, ok } from 'assert';
import { getInjectEnv } from '../test-util/env';
import { DEFAULT_CHAT_SCHEMA_KEY, WorkflowData } from '../../src/share';
import { OpenAITestChat } from '../../src/service/ai/client/chat/vendor/openai-test';
import { RunnerError } from '../../src/service/ai/workflow/runner/runner-error';
import { inspect } from 'util';

describe('工作流:条件', () => {
  // 对话
  function chatWorkflowFactory(config: any = {}) {
    return {
      flow: {
        nodes: [
          {
            position: { x: 300, y: 300 },
            id: 'ddbe73d3-688c-457f-9881-53a2fd1a91c2',
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
                      inputType: 'object',
                      value: 'value',
                      label: 'value',
                      id: 'aaf3055e-822a-553e-bef1-4a879457e569',
                    },
                  ],
                ],
                output: [
                  [
                    {
                      value: 'value===1',
                      label: 'value===1',
                      id: '2f592821-6c60-5e9e-998d-9c0a475a5fd5',
                    },
                    {
                      label: '[否则]',
                      value: '[否则]',
                      id: 'cba689c7-cc83-5987-95e9-10af717f1f71',
                    },
                  ],
                ],
              },
              title: '条件',
              config: { conditions: [{ value: 'value===1' }] },
            },
            width: 300,
            type: 'condition',
            measured: { width: 300, height: 108 },
            selected: false,
          },
          {
            position: { x: 915, y: 245 },
            id: '0da2261f-0e51-45dc-83fa-c78979cd11a7',
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
            position: { x: 950, y: 405 },
            id: '435a432e-36fd-4142-949d-aa671826900c',
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
            selected: false,
          },
        ],
        edges: [
          {
            source: 'ddbe73d3-688c-457f-9881-53a2fd1a91c2',
            sourceHandle: '2f592821-6c60-5e9e-998d-9c0a475a5fd5',
            target: '0da2261f-0e51-45dc-83fa-c78979cd11a7',
            targetHandle: '79cce85d-1231-56fa-9afb-afb06b1c5b53',
            id: 'xy-edge__ddbe73d3-688c-457f-9881-53a2fd1a91c22f592821-6c60-5e9e-998d-9c0a475a5fd5-0da2261f-0e51-45dc-83fa-c78979cd11a779cce85d-1231-56fa-9afb-afb06b1c5b53',
          },
          {
            source: 'ddbe73d3-688c-457f-9881-53a2fd1a91c2',
            sourceHandle: 'cba689c7-cc83-5987-95e9-10af717f1f71',
            target: '435a432e-36fd-4142-949d-aa671826900c',
            targetHandle: '79cce85d-1231-56fa-9afb-afb06b1c5b53',
            id: 'xy-edge__ddbe73d3-688c-457f-9881-53a2fd1a91c2cba689c7-cc83-5987-95e9-10af717f1f71-435a432e-36fd-4142-949d-aa671826900c79cce85d-1231-56fa-9afb-afb06b1c5b53',
          },
        ],
        viewport: {
          x: -37.54818699359839,
          y: 160.61451048988147,
          zoom: 0.5000000137715963,
        },
      },
      version: 3,
      update: 1734061813456,
    } as Pick<WorkflowData, 'flow'>;
  }
  let injector = getInjectEnv();
  let instance = injector.get(WorkflowParserService);
  let runner = injector.get(WorkflowRunnerService);
  it('匹配成功', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map([['value', { value: 1 }]]),
    });
    equal(result.value, '111');
  });
  it('匹配失败', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map([['value', { value: 2 }]]),
    });
    equal(result.value, '222');
  });
  it('缺少参数', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    try {
      let result = await runner.run(resolved.data!, {
        input: new Map([]),
      });
    } catch (error) {
      ok(error instanceof RunnerError);
      ok(inspect(error).includes('value'));
      return
    }
    throw new Error('不应该成功');
  });
});
