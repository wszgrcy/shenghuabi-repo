import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { KnowledgeQueryDefine } from '@bridge/share';
import { PiyingView } from '@piying/view-angular';
import { FieldGlobalConfig } from '@fe/form/default-type-config';
import { TrpcService } from '@fe/trpc';

import { debounceTime } from 'rxjs';
import * as v from 'valibot';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule, FormsModule, ReactiveFormsModule, PiyingView],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export default class KnowledgeQuery {
  // group = new FormGroup({});
  model = signal({} as any);
  schema = KnowledgeQueryDefine;
  options = {
    fieldGlobalConfig: FieldGlobalConfig,
  };
  #trpc = inject(TrpcService).client;
  constructor() {
    toObservable(this.model)
      .pipe(debounceTime(500))
      .subscribe((value: v.InferOutput<typeof KnowledgeQueryDefine>) => {
        if (!value.query) {
          return;
        }
        this.#trpc.knowledge.query.query(value);
      });
  }
  modelChange(value: any) {
    this.model.set({ ...value });
  }
}
