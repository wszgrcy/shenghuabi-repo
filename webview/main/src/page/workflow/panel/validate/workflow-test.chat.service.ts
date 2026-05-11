import { WorkflowChatOptions } from '@bridge/share';
import { ChatService } from '@fe/component/chat/chat.service';
import { Injectable } from '@angular/core';
@Injectable()
export class WorkflowTestChatService extends ChatService {
  override display = { title: false, tooltip: false };
  workflow: any;

  override async getWorkflowWithDefine(
    workflow: NonNullable<WorkflowChatOptions['workflow']>,
  ) {
    return this.workflow;
  }
}
