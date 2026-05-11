import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import JSONFormatter from 'json-formatter-js';

@Directive({
  selector: '[valueFormat]',
  standalone: true,
})
export class ValueFormatDirective {
  valueFormat = input.required();
  #element = inject(ElementRef);
  constructor() {
    effect(() => {
      if (!this.valueFormat()) {
        this.#element.nativeElement.innerHTML = '';
      }
      const formatter = new JSONFormatter(this.valueFormat(), 2, {
        hoverPreviewEnabled: true,
      });
      this.#element.nativeElement.innerHTML = '';
      this.#element.nativeElement.appendChild(formatter.render());
    });
  }
}
