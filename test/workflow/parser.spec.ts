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

describe('工作流:解析', () => {
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
            position: { x: 425, y: 295 },
            id: 'ad27b916-d589-4ef9-9603-479e0efa931f',
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
              title: '图片输入',
              config: { format: 'chat_base64' },
              excludeUsage: true,
            },
            width: 300,
            type: 'image',
            measured: { width: 300, height: 109 },
            selected: false,
            dragging: false,
            className: '',
          },
          {
            position: { x: 2685, y: 1540 },
            id: '7fd503ad-a5c3-4a02-8456-cb3eda84902f',
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
              value: '',
              title: '文本模板',
              options: { disableOpenConfig: false },
              excludeUsage: true,
            },
            width: 300,
            type: 'textarea',
            measured: { width: 300, height: 107 },
            selected: true,
          },
        ],
        edges: [],
        viewport: {
          x: -1605.5242230492302,
          y: -927.8607122351702,
          zoom: 0.707106790924525,
        },
      },
      version: 3,
      update: 1734138493824,
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
    ok(!resolved.data);
    ok(resolved.error);
  });
});
