import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TrpcService } from '@fe/trpc';

import { SafeHtmlPipe } from '../../pipe/san-html.pipe';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [AsyncPipe, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class KnowledgeQuery {
  #trpc = inject(TrpcService).client;
  data = this.#trpc.idAsset.get.query(window.__pageConfig.data.id!);

  constructor() {
    const client = this.#trpc;
    customElements.define(
      'command-wrapper',
      class MyCustomizedBuiltInElement extends HTMLAnchorElement {
        constructor() {
          super();
          this.addEventListener('click', (e) => {
            client.command.exec.query({
              command: this.dataset['command']!,
              options: [this.dataset['arg0'], this.dataset['arg1']],
            });
            e.preventDefault();
          });
        }
      },
      {
        extends: 'a',
      },
    );
  }
}
