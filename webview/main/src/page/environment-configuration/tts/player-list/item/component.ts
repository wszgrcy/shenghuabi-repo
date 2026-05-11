import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { asControl, PiyingView } from '@piying/view-angular';
import { actions, setComponent } from '@piying/view-angular-core';
import { DefaultFormTypes, Wrappers } from '@fe/form/default-type-config';
import { asColumn, selectOptions } from '@share/valibot';
import * as v from 'valibot';
import { LanguageList } from '../const';
const FieldGlobalConfig = {
  types: {
    ...DefaultFormTypes,
    record: {
      type: () =>
        import('@cyia/component/wave-record').then(
          (item) => item.WaveRecordFCC,
        ),
    },
  },
  wrappers: {
    ...Wrappers,
  },
};

@Component({
  selector: 'app-config',
  templateUrl: './component.html',
  imports: [PiyingView, MatDialogModule, MatButtonModule],
})
export class ConfigComponent implements OnInit {
  options = {
    fieldGlobalConfig: FieldGlobalConfig,
  };
  formly = viewChild<any>('formly');
  data = inject(MAT_DIALOG_DATA);
  type = !!this.data.data;
  modelValue = signal(this.data.data);
  schema = v.pipe(
    v.object({
      record: v.pipe(
        v.custom((item) => !!item),
        setComponent('record'),
        actions.class.top('w-[300px]'),
        actions.inputs.patch({
          maxDuration: 60,
          maxDurationTooltip: '音频持续时间过长,请尽量保证持续时间不超过1分钟',
        }),
      ),
      config: v.pipe(
        v.object({
          player: v.pipe(v.optional(v.string(), 'default'), v.title('名字')),
          state: v.pipe(v.optional(v.string(), 'default'), v.title('状态')),
          language: v.pipe(
            v.optional(
              v.picklist(LanguageList.map((item) => item.value)),
              'chinese',
            ),
            v.title('语言'),
            selectOptions(LanguageList),
          ),
          aliases: v.pipe(
            v.optional(v.array(v.string())),
            asControl(),
            setComponent('chip-input-list'),
            actions.wrappers.set(['label']),
            actions.inputs.patch({ addOnBlur: true }),
            v.title('别名'),
          ),
        }),
        asColumn(),
      ),
    }),
    asColumn(),
  );
  ref = inject(MatDialogRef);

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
}
