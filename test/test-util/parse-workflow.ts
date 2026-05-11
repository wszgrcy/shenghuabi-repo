import { path } from '@cyia/vfs2';
import fs from 'fs';
import { Injector } from 'static-injector';
import { WorkflowFileService } from '@shenghuabi/workflow';

export async function parseWorkflow(fileName: string, injector: Injector) {
  let fileService = injector.get(WorkflowFileService);
  let filePath = path.join(
    TEST_CWD,
    'test/fixture/workflow',
    `${fileName}.workflow`,
  );
  let file = fileService.getFile(filePath);
  return await file.readOriginData();
}
