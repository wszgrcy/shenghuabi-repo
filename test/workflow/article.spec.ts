import { INJECTOR_SCOPE, Injector } from 'static-injector';
import { WorkflowParserService } from '../../src/service/ai/workflow/workflow-parser.service';
import { WorkflowRunnerService } from '../../src/service/ai/workflow/runner/workflow-runner.service';
import { deepEqual, deepStrictEqual, equal, ok } from 'assert';
import { getInjectEnv } from '../test-util/env';
import {
  ChatContextType,
  DEFAULT_CHAT_SCHEMA_KEY,
  WorkflowData,
} from '../../src/share';
import { OpenAITestChat } from '../../src/service/ai/client/chat/vendor/openai-test';
import { RunnerError } from '../../src/service/ai/workflow/runner/runner-error';
import * as vscode from 'vscode';

describe('工作流:文章', () => {
  // 对话
  function chatWorkflowFactory(
    config: any = { mode: 'insert', step: 0 },
    outputName?: string,
  ) {
    return {
      flow: {
        nodes: [
          {
            position: { x: 220, y: 150 },
            id: '493187d8-aebc-4d0e-9a86-a229e241d6e2',
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
                      id: 'e6f85cdd-c3a4-536b-a226-9f62a23c3540',
                      label: '第一项',
                      value: 'first',
                    },
                    {
                      id: 'c7e86e78-fcb4-5c93-87b7-63fb3a0b4093',
                      label: '扁平数组',
                      value: 'flat',
                    },
                  ],
                ],
              },
              value: ['foo', 'bar'],
              title: '文章',
              config: config,
              outputName,
            },
            width: 300,
            type: 'article',
            measured: { width: 300, height: 205 },
            selected: true,
          },
        ],
        edges: [],
        viewport: {
          x: 65.7778386451364,
          y: 38.012326139331435,
          zoom: 0.7071067909245367,
        },
      },
      version: 3,
      update: 1734058019838,
    } as Pick<WorkflowData, 'flow'>;
  }
  let injector = getInjectEnv();
  let instance = injector.get(WorkflowParserService);
  let runner = injector.get(WorkflowRunnerService);
  it('基础', async () => {
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map(),
    });
    ok(Array.isArray(result.value));
    ok((result.value[0] as string).includes('foo-content'));
    ok((result.value[0] as string).includes('bar-content'));
  });
  it('插入分组', async () => {
    let chatData = chatWorkflowFactory({ step: 1 });
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map(),
    });
    ok(Array.isArray(result.value));
    equal(result.value.length, 2);
    for (const item of result.value) {
      equal(typeof item, 'string');
    }
  });
  it('切片分组', async () => {
    let chatData = chatWorkflowFactory({ step: 1, mode: 'chunk' });
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map(),
    });
    ok(Array.isArray(result.value));
    equal(result.value.length, 2);
    for (const item of result.value) {
      ok(Array.isArray(item));
    }
    let filePathList = ['foo', 'bar'];
    for (let index = 0; index < result.extra.length; index++) {
      const item = result.extra[index];
      ok(Array.isArray(item));
      equal(item[0].metadata.type, ChatContextType.article);
      ok(item[0].metadata.description.includes(filePathList[index]));
    }
  });
  it('拍平', async () => {
    let chatData = chatWorkflowFactory({ step: 1, mode: 'chunk' }, 'flat');
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map(),
    });
    ok(Array.isArray(result.value));
    equal(result.value.length, 2);
    equal(result.extra.length, 2);
    for (const item of result.value) {
      equal(typeof item, 'string');
    }
    let filePathList = ['foo', 'bar'];
    for (let index = 0; index < result.extra.length; index++) {
      const item = result.extra[index];
      equal(item.metadata.type, ChatContextType.article);
      ok(item.metadata.description.includes(filePathList[index]));
    }
  });
  it('第一项', async () => {
    let chatData = chatWorkflowFactory({ step: 1, mode: 'chunk' }, 'first');
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map(),
    });
    ok(typeof result.value, 'string');
    equal(result.extra.metadata.type, ChatContextType.article);
    ok(result.extra.metadata.description.includes('foo'));
  });
});
