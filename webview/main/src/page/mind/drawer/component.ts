import { Component, Injector, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { BridgeService } from '../service';
import { MIND_DEFINE } from '../config/config-editor';
import { PiyingView } from '@piying/view-angular';
import { TrpcService } from '@fe/trpc';
import { BehaviorSubject, finalize, Observable } from 'rxjs';
import { FieldGlobalConfig } from '../field-default-cofig';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule, PiyingView, ReactiveFormsModule, MatDialogModule],
})
export class NodeConfigComponent {
  #dialogData = inject(MAT_DIALOG_DATA);
  data = this.#dialogData.data;
  type = this.#dialogData.data.type;
  #trpc = inject(TrpcService);

  templateListOb = () => {
    let listSup: any;
    const observable = new Observable<{ label: string; value: string }[]>(
      (ob) => {
        listSup = this.#trpc.client.mind.nodeTemplate.getAll$.subscribe(
          undefined,
          {
            onData: (obj) => {
              ob.next([
                { label: '---空---', value: '' },
                ...Object.keys(obj).map((value) => {
                  return { label: value, value: value };
                }),
              ]);
            },
            onComplete: () => {
              ob.complete();
            },
          },
        );
      },
    ).pipe(
      finalize(() => {
        listSup.unsubscribe();
      }),
    );
    return observable;
  };
  fieldContext = {
    getAllTheme: () => {
      return this.#trpc.client.mind.nodeTheme.getAll
        .query(undefined)
        .then((list) => {
          return [
            { label: '---空---', value: '' },
            ...list.map((item) => {
              return { label: item, value: item };
            }),
          ];
        });
    },
    openThemeDir: () => {
      this.#trpc.client.mind.openThemeDir.query(undefined);
    },
    isGlobal$$: new BehaviorSubject(false),
    enableEditorConfig$$: new BehaviorSubject(
      this.type === 'card' || this.type === 'chat',
    ),
    templateList$$: this.templateListOb(),
  };
  // configForm = new FormGroup({});
  #injector = inject(Injector);
  #service = inject(BridgeService);
  schema = MIND_DEFINE;
  options = {
    context: this.fieldContext,
    fieldGlobalConfig: FieldGlobalConfig,
  };

  ref = inject(MatDialogRef);
  apply() {
    this.ref.close(this.data);
  }
}
