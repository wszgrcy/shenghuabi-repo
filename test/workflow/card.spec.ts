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
import { WatchService } from '../../src/service/fs/watch.service';
import { WorkspaceService } from '../../src/service/workspace.service';
import { MIND_GLOB } from '../../src/const';

describe('工作流:卡片', () => {
  let inited: Promise<void>;
  let instance: WorkflowParserService;
  let runner: WorkflowRunnerService;
  // 对话
  function chatWorkflowFactory(config: any = {}, outputName?: string) {
    return {
      flow: {
        nodes: [
          {
            position: { x: 450, y: 235 },
            id: 'd3638e07-b4c1-457a-bdb6-2e33ab858a10',
            data: {
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
              value: [
                {
                  label: 'fooCard',
                  value:
                    'c3fbc7de-0322-49c5-83cd-bb058c5c51dc/582c4395-79c4-4946-9089-f7c838a33080',
                },
                {
                  label: 'barCard',
                  value:
                    'c3fbc7de-0322-49c5-83cd-bb058c5c51dc/5d2eb039-7446-401c-8ca8-46dd9af2d5d9',
                },
              ],
              config: {},
              transform: { resizable: true },
              title: '脑图卡片',
            },
            width: 300,
            type: 'mindCard',
            measured: { width: 300, height: 145 },
            selected: false,
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
      update: 1734060908101,
    } as Pick<WorkflowData, 'flow'>;
  }
  beforeEach(() => {
    let injector = getInjectEnv();
    instance = injector.get(WorkflowParserService);
    runner = injector.get(WorkflowRunnerService);
    let watchService = injector.get(WatchService);
    watchService.init();
    inited = new Promise<void>((resolve) => {
      watchService.fileObject$.subscribe((list) => {
        if (list.length) {
          resolve();
        }
      });
    });
  });
  it('基础', async () => {
    await inited;
    let chatData = chatWorkflowFactory();
    let resolved = instance.parse(chatData);
    let result = await runner.run(resolved.data!, {
      input: new Map(),
    });
    ok(Array.isArray(result.value));
    ok((result.value[0] as string).includes('foo-content'));
    ok((result.value[1] as string).includes('bar-content'));
    ok(Array.isArray(result.extra));
    for (let i = 0; i < result.extra.length; i++) {
      const item = result.extra[i];
      equal(typeof item.metadata, 'object');
      equal(item.metadata.type, ChatContextType.card);
    }
  });
});
