import { Component, inject, signal } from '@angular/core';
import { TrpcService } from '@fe/trpc';

import { PiyingView } from '@piying/view-angular';
import { FieldGlobalConfig } from '@fe/form/default-type-config';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DownloadButtonFCC } from '@fe/component/download-button/component';

import { debounceTime, Subject } from 'rxjs';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [PiyingView, MatProgressSpinnerModule],
  providers: [],
})
export default class PluginConfigEditor {
  #client = inject(TrpcService).client;
  pluginConfig = this.#client.pluginConfig;
  readonly Define$ = signal<any>(undefined);
  model$ = signal<any>(undefined);

  options = {
    context: this,
    fieldGlobalConfig: {
      ...FieldGlobalConfig,
      types: {
        ...FieldGlobalConfig.types,
        'download-button': {
          type: DownloadButtonFCC,
        },
      },
    },
  };
  #changedValue$$ = new Subject();
  constructor() {
    this.#client.pluginConfig.init.query(undefined).then((config) => {
      this.model$.set(config.value);
      import(config.definePath).then((a: any) => {
        this.Define$.set(a.default);
      });
    });
    this.#changedValue$$.pipe(debounceTime(500)).subscribe((value) => {
      this.#client.pluginConfig.set.query(value);
    });
  }

  valueChange(value: any) {
    this.#changedValue$$.next(value);
  }
}
