import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { parse } from 'marked';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './component.scss',
})
export class MarkdownComponent {
  content = input.required<string>();
  #domSanitizer = inject(DomSanitizer);
  html$ = computed(() => {
    return this.#domSanitizer.bypassSecurityTrustHtml(
      parse(this.content(), { gfm: true, async: false }),
    );
  });
}
