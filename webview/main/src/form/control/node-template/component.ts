import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PI_VIEW_FIELD_TOKEN } from '@piying/view-angular';
import { BaseControl } from '@piying/view-angular';
import { TrpcService } from '@fe/trpc';

@Component({
  selector: 'node-template-apply',
  templateUrl: 'component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NodeTemplateApplyFCC),
      multi: true,
    },
  ],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// 需要调试
export class NodeTemplateApplyFCC extends BaseControl {
  #field = inject(PI_VIEW_FIELD_TOKEN);
  set() {
    const value = this.value$();
    this.valueChange(value);
    this.configObject$().then((obj) => {
      const templateData = obj[value];
      if (!templateData) {
        return;
      }
      const dataField = this.#field().get(['#', 'data'])!;
      dataField.form.control!.updateValue({
        ...dataField.form.control!.value$$(),
        ...templateData,
      });
    });
  }
  save() {
    this.valueChange(this.value$());
    const dataField = this.#field().get(['#', 'data'])!;
    const rootModel = dataField.form.control?.value!;
    this.#client.mind.nodeTemplate.saveItem
      .query({
        name: this.value$(),
        data: rootModel || {},
      })
      .then(() => {
        this.#updateIndex$.update((v) => v + 1);
      });
  }
  #client = inject(TrpcService).client;
  configObject$ = computed<Promise<Record<string, any>>>(() => {
    this.#updateIndex$();
    return this.#client.mind.nodeTemplate.getAll.query(undefined);
  });
  #updateIndex$ = signal(0);
  configKey$ = computed(() => {
    return this.configObject$().then((obj) => {
      return Object.keys(obj).map((item) => item.toLowerCase());
    });
  });
  filterList$ = computed(() => {
    const searchContent = (this.value$() ?? '').toLowerCase();
    return this.configKey$().then((keyList) => {
      keyList = keyList.filter((item) => {
        return item.includes(searchContent);
      });
      if (!keyList.length) {
        return [];
      } else {
        return keyList;
      }
    });
  });

  optionSelected(data: MatAutocompleteSelectedEvent) {
    this.valueChange(data.option.value);
  }
}
