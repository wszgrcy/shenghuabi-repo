import { inject, Injectable } from '@angular/core';
import { TrpcService } from './trpc.service';
import { v5 } from 'uuid';
import { UUID_NS } from '@bridge/share';

@Injectable({
  providedIn: 'root',
})
export class ChatTemplateService {
  #client = inject(TrpcService).client;
  parseTemplate =
    (str: string | string[], language?: 'js' | 'plaintext' | 'liquid') =>
    () => {
      return this.#client.workflow.parseTemplate
        .query({ content: typeof str === 'string' ? [str] : str, language })
        .then((value) => {
          if (value.error) {
            return;
          }
          return value.list.map((item) => {
            return { ...item, label: item.value, id: v5(item.value, UUID_NS) };
          });
        });
    };
}
