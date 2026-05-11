import { Component, computed, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { deepClone, RawWorkflowNode, WebviewNodeConfig } from '@bridge/share';

import { v4 } from 'uuid';
import { PiyingView } from '@piying/view-angular';

import { asVirtualGroup, condition } from '@piying/view-angular';
import { MatButtonModule } from '@angular/material/button';
import { defaultConfigMerge } from '@fe/util/default-config-merge';
import * as v from 'valibot';
import { HandleDataDefine } from '@share/valibot/define';
import { FormWrappers } from '../../../../page/workflow/define/node-form';
import { ChatNodeService } from '../../../../domain/chat-node/chat-node.service';
import { DefaultFormTypes } from '@fe/form/default-type-config';
const HandleAddon$$ = computed(() => {
  return v.object({
    data: v.object({
      handle: HandleDataDefine,
    }),
  });
});
const FieldGlobalConfig = {
  types: DefaultFormTypes,
  wrappers: FormWrappers,
};
@Component({
  selector: 'select-item',
  templateUrl: './component.html',
  styleUrl: './component.scss',
  standalone: true,
  imports: [PiyingView, MatDialogModule, MatButtonModule],
  providers: [],
})
export class WorkflowNodeDialogComponent {
  #dialogData = inject<{
    data: RawWorkflowNode;
    config: WebviewNodeConfig;
  }>(MAT_DIALOG_DATA);
  readonly title = this.#dialogData.config.label;
  #ref = inject(MatDialogRef);
  model = signal(
    this.#dialogData.data
      ? deepClone(this.#dialogData.data)
      : {
          id: v4(),
          ...defaultConfigMerge(
            this.#dialogData.config,
            this.#dialogData.config.templateConfig,
          ),
          type: this.#dialogData.config.type,
        },
  );
  context = inject(ChatNodeService).context;
  schema = v.pipe(
    v.intersect([this.#dialogData.config.templateConfig!, HandleAddon$$()]),
    condition({
      environments: ['display', 'template'],
      actions: [asVirtualGroup()],
    }),
  );
  options = {
    context: this.context,
    fieldGlobalConfig: FieldGlobalConfig,
    environments: ['display', 'template'],
  };

  apply() {
    this.#ref.close(this.model());
  }
}
