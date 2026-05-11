import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { parse } from 'marked';

@Pipe({ name: 'markdown', standalone: true, pure: true })
export class MarkdownPipe implements PipeTransform {
  #domSanitizer = inject(DomSanitizer);

  transform(value: string) {
    return this.#domSanitizer.bypassSecurityTrustHtml(
      parse(value, { gfm: true, async: false }),
    );
  }
}
