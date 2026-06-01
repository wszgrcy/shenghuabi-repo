import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { CustomNode, deepClone, WebviewNodeConfig } from '@bridge/share';

import { v4 } from 'uuid';
import { PiyingView } from '@piying/view-angular';

import { MatButtonModule } from '@angular/material/button';
import { defaultConfigMerge } from '@fe/util/default-config-merge';
import * as v from 'valibot';
import { FormWrappers } from '../../../../page/workflow/define/node-form';
import { ChatNodeService } from '../../../../domain/chat-node/chat-node.service';
import { DefaultFormTypes } from '@fe/form/default-type-config';

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
    data: CustomNode;
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
            this.#dialogData.config.configDefine,
          ),
          type: this.#dialogData.config.type,
        },
  );
  context = inject(ChatNodeService).context;
  schema = v.pipe(this.#dialogData.config.configDefine!);
  options = {
    context: this.context,
    fieldGlobalConfig: FieldGlobalConfig,
  };

  apply() {
    this.#ref.close(this.model());
  }
}
