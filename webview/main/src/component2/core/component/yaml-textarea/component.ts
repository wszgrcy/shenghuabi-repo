import { Component, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { BaseControl } from '@piying/view-angular';
import { parse, stringify } from 'yaml';

@Component({
  selector: 'yaml-textarea',
  templateUrl: './component.html',
  standalone: true,
  imports: [MatInputModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => YamlTextAreaFCC),
      multi: true,
    },
  ],
})
export class YamlTextAreaFCC extends BaseControl {
  override writeValue(obj: any): void {
    this.value$.set(obj ? stringify(obj).trim() : '');
  }

  override valueChange(value: any) {
    try {
      this.emitValue!(parse(value));
    } catch (error) {}
  }
}
