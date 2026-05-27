import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  WritableSignal,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TrpcService } from '@fe/trpc';
import { ChatService } from '@fe/component/chat/chat.service';
import { ChatComponent, ChatConfig } from '@fe/component/chat/component';
import { WorkflowTestChatService } from './workflow-test.chat.service';
import { ChatMode } from '@bridge/share';
import { v4 } from 'uuid';
@Component({
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    ChatComponent,
    MatTooltipModule,
  ],
  providers: [
    { provide: ChatService, useExisting: WorkflowTestChatService },
    WorkflowTestChatService,
  ],
  templateUrl: './component.html',
  styleUrl: './component.scss',
  selector: `validate-panel`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidatePanelComponent {
  flowData = input.required<any>();
  close$ = input.required<WritableSignal<boolean>>();
  configForm = new FormGroup({});
  #injector = inject(Injector);
  #client = inject(TrpcService).client;
  chatComp = viewChild<ChatComponent>('chat');
  service = inject(WorkflowTestChatService);
  readonly mode = ChatMode.workflow;
  readonly config$ = signal<Pick<ChatConfig, 'workflow'>>({});
  constructor() {
    effect(() => {
      const comp = this.chatComp();
      if (!comp) {
        return;
      }
      const data = this.flowData();
      if (!data.flow.nodes.length) {
        return;
      }
      this.#client.workflow.parseDefine.query(data).then((item) => {
        console.log('解析结果', item);
        if (!item.error) {
          this.service.workflow = {
            ...data,
            define: item.data!,
            resolved: item,
          };

          this.config$.set({ workflow: { path: v4() } });
        } else {
          console.error(item.error);
        }
      });
    });
  }
  stopSignal = signal<{ clear: boolean } | undefined>(undefined);
  closeSelf() {
    this.close$().set(false);
  }

  reset(clear: boolean) {
    console.log('充值?', clear);
    this.stopSignal.set({ clear });
  }
}
