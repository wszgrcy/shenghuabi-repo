import {
  INJECTOR_SCOPE,
  Injector,
  createInjector,
  createRootInjector,
} from 'static-injector';
import { parseWorkflow } from '../test-util/parse-workflow';
import { WorkflowParserService } from '../../src/service/ai/workflow/workflow-parser.service';
import { WorkflowRunnerService } from '../../src/service/ai/workflow/runner/workflow-runner.service';
import { deepEqual, equal, ok } from 'assert';

describe('工作流', () => {
  it('解析:hello', async () => {
    let injector = createRootInjector({
      providers: [{ provide: INJECTOR_SCOPE, useValue: 'root' }],
    });
    let workflowData = await parseWorkflow('hello', injector);
    ok(workflowData.flow);
    let instance = injector.get(WorkflowParserService);
    let resolved = instance.parse(workflowData);
    ok(resolved);
    ok(!resolved.manualInput);
    ok(resolved.data);
    deepEqual(resolved.data?.inputList, []);
    let runner = injector.get(WorkflowRunnerService);
    let result = await runner.run(resolved.data!, { input: new Map() });
    equal(result.value, 'hello');
  });
});
