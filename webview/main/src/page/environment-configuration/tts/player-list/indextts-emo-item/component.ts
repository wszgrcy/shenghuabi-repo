import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { PiyingView } from '@piying/view-angular';
import { DefaultFormTypes, Wrappers } from '@fe/form/default-type-config';
import { IndexTTSRefItemFormDefine } from '@shenghuabi/python-addon/define';
import { TrpcService } from '@fe/trpc';
const FieldGlobalConfig = {
  types: {
    ...DefaultFormTypes,
  },
  wrappers: {
    ...Wrappers,
  },
};

@Component({
  selector: 'appindextts-emo-config',
  templateUrl: './component.html',
  imports: [PiyingView, MatDialogModule, MatButtonModule],
})
export class IndexTTSEmoConfigComponent implements OnInit {
  options = {
    fieldGlobalConfig: FieldGlobalConfig,
    context: this,
  };
  formly = viewChild<any>('formly');
  data = inject(MAT_DIALOG_DATA);
  type = !!this.data.data;
  modelValue = signal(this.data.data);
  schema = IndexTTSRefItemFormDefine;
  ref = inject(MatDialogRef);
  #client = inject(TrpcService).client;

  loading$ = signal(false);
  ngOnInit(): void {}
  apply() {
    this.loading$.set(true);

    return (this.data.save as (a: any) => Promise<any>)(this.modelValue())
      .then(() => {
        this.ref.close(true);
      })
      .finally(() => {
        this.loading$.set(false);
      });
  }
  getAudioReferenceList() {
    return this.#client.environment.pythonAddon.getPlayerIdList
      .query(undefined)
      .then((a) => {
        console.log('1', a);
        return a;
      });
  }
  getIndexTTSEmoReferenceList() {
    return this.#client.environment.pythonAddon.getEmoPlayerIdList
      .query(undefined)
      .then((a) => {
        console.log('2', a);
        return a;
      });
  }
}
