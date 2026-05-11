import clsx from 'clsx';
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

import { PiyingView, PiViewConfig } from '@piying/view-angular';
import { ColClass, DictImportDefine } from '@bridge/share';
import { asVirtualGroup } from '@piying/view-angular';
import { actions, getDefaults } from '@piying/view-angular-core';

import * as v from 'valibot';
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
export default class DictImport {
  formly = viewChild(PiyingView);
  // group = new FormGroup({});
  model = signal(getDefaults(DictImportDefine));

  #trpc = inject(TrpcService).client;
  loading = signal(false);
  context = {
    selectFile: () => {
      return this.#trpc.knowledge.selectFile.query(undefined);
    },
    getDictFileName: (value: string) => {
      return this.#trpc.knowledge.getDictFileName.query(value);
    },
  };
  options = {
    context: this.context,
    fieldGlobalConfig: FieldGlobalConfig,
  };
  schema = v.pipe(
    DictImportDefine,
    asVirtualGroup(),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: clsx(ColClass) } },
    ]),
  );

  submit() {
    this.loading.set(true);
    this.#trpc.knowledge.importDict
      .query({ ...this.model(), type: 'dict' })
      .finally(() => {
        // this.group.reset();
        this.formly()?.form$$()!.reset();
        this.loading.set(false);
      });
  }
}
