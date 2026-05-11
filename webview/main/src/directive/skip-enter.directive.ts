import { Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[skipEnter]',
  standalone: true,
})
export class SkipEnterDirective {
  keypressEnter = output();
  constructor() {
    (inject(ElementRef).nativeElement as HTMLElement).addEventListener(
      'keypress',
      (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.stopPropagation();
          e.preventDefault();
          this.keypressEnter.emit();
        }
      },
    );
  }
}
