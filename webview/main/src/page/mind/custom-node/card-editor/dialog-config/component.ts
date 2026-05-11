import { Component, inject, linkedSignal, signal } from '@angular/core';
import { PiyingView } from '@piying/view-angular';
import * as v from 'valibot';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FieldGlobalConfig } from '@fe/form/default-type-config';

@Component({
  selector: 'dialog-config',
  templateUrl: './component.html',
  standalone: true,
  imports: [PiyingView, MatCardModule, MatDialogModule, MatButtonModule],
  providers: [],
})
export class DialogConfigComponent {
  #data = inject<{
    title: string;
    schema: v.BaseSchema<any, any, any>;
    bereforeClose?: (data: any) => Promise<any>;
    context: Record<string, any>;
    value: any;
  }>(MAT_DIALOG_DATA);
  title = this.#data.title;
  schema = this.#data.schema;
  context = this.#data.context;
  options = {
    context: this.#data.context,
    fieldGlobalConfig: FieldGlobalConfig,
  };

  model$ = signal(this.#data.value ?? {});
  #value = linkedSignal(() => this.model$());
  valueChange(value: any) {
    this.#value.set(value);
  }
  getValue() {
    return this.#value();
  }
  #ref = inject(MatDialogRef);

  async submit() {
    let model = this.model$();
    model = (await this.#data.bereforeClose?.(model)) ?? model;
    this.#ref.close(model);
  }
}
