import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControl } from '@piying/view-angular';

@Component({
  selector: 'div[field-control]',
  template: ``,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DivFCC),
      multi: true,
    },
  ],
})
export class DivFCC extends BaseControl {}
