import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  sanitizer = inject(DomSanitizer);
  transform(value: any): any {
    if (!value) {
      return value;
    }
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
