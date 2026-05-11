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
import { path } from '@cyia/vfs2';

describe('工作流:文件', () => {
  // 对话
  function chatWorkflowFactory(
    config: any = {},
    filePathList: string[] = [],
    outputName?: string,
  ) {
    return {
      flow: {
        nodes: [
          {
            position: { x: 775, y: 455 },
            id: '834bd70b-55e3-4efd-aec7-17189b16e10d',
            data: {
              outputName: '',
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
              value: filePathList,
              config: { splitPages: false, alwaysArray: false },
              transform: { resizable: true },
              title: '文件输入',
            },
            width: 300,
            type: 'file',
            measured: { width: 300, height: 141 },
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
      update: 1734067573480,
    } as Pick<WorkflowData, 'flow'>;
  }
  let injector = getInjectEnv();
  let instance = injector.get(WorkflowParserService);
  let runner = injector.get(WorkflowRunnerService);
  it('基础', async () => {
    let chatData = chatWorkflowFactory(undefined, [
      path.join(TEST_CWD, './test/fixture/workspace/foo'),
    ]);
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map(),
    });
    ok((result.value as string).includes('foo-content'));
  });
  it('数组', async () => {
    let chatData = chatWorkflowFactory(undefined, [
      path.join(TEST_CWD, './test/fixture/workspace/foo'),
      path.join(TEST_CWD, './test/fixture/workspace/bar'),
    ]);
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map(),
    });
    ok(Array.isArray(result.value));
    ok((result.value[0][0] as string).includes('foo-content'));
    ok((result.value[1][0] as string).includes('bar-content'));
  });
});
