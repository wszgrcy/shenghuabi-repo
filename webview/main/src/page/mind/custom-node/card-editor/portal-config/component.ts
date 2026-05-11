import { Component, computed, input, linkedSignal } from '@angular/core';

import { PiyingView } from '@piying/view-angular';
import * as v from 'valibot';
import { MatCardModule } from '@angular/material/card';
import { FieldGlobalConfig } from '@fe/form/default-type-config';

@Component({
  selector: 'portal-config',
  templateUrl: './component.html',
  standalone: true,
  imports: [PiyingView, MatCardModule],
  providers: [],
})
export class PortalConfigComponent {
  schema = input.required<v.BaseSchema<any, any, any>>();
  context = input.required<Record<string, any>>();

  options$$ = computed(() => ({
    context: this.context(),
    FieldGlobalConfig,
  }));

  model = input<any>();
  #value = linkedSignal(() => this.model());
  valueChange(value: any) {
    this.#value.set(value);
  }
  getValue() {
    return this.#value();
  }
}
