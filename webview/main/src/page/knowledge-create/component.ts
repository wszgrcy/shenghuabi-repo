import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TrpcService } from '@fe/trpc';
import { CreateKnowledgeFormDefine } from '@bridge/share';
import { PiyingView, PiViewConfig } from '@piying/view-angular';
import { asVirtualGroup } from '@piying/view-angular';
import { getDefaults } from '@piying/view-angular-core';

import * as v from 'valibot';
import { asColumn } from '@share/valibot';
import { DefaultFormTypes, Wrappers } from '@fe/form/default-type-config';
const FieldGlobalConfig = {
  types: DefaultFormTypes,
  wrappers: {
    ...Wrappers,
  },
} as PiViewConfig;
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule, FormsModule, ReactiveFormsModule, PiyingView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export default class KnowledgeCreate {
  loading$ = signal(false);
  // group = new FormGroup({});
  model = signal(getDefaults(CreateKnowledgeFormDefine));
  extraPanelSet = new Set<string>();

  context = {
    selectWorkflow: () => {
      return this.#trpc.workflow.selectWorkflow.query(undefined);
    },
  };
  options = {
    context: this.context,
    fieldGlobalConfig: FieldGlobalConfig,
  };
  schema = v.pipe(CreateKnowledgeFormDefine, asVirtualGroup(), asColumn());

  #trpc = inject(TrpcService).client;
  formly = viewChild(PiyingView);
  constructor() {}

  submit() {
    if (this.extraPanelSet.size) {
      this.#trpc.knowledge.closePanel.query([...this.extraPanelSet]);
    }
    this.loading$.set(true);
    this.#trpc.knowledge.create
      .query({ ...this.model(), type: 'knowledge' })
      .then(() => {
        this.formly()?.form$$()!.reset();
      })
      .finally(() => {
        this.loading$.set(false);
      });
  }
}
