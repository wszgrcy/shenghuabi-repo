import { inject, Injectable } from '@angular/core';
import { TrpcService } from './trpc.service';
import { v5 } from 'uuid';
import { UUID_NS } from '@bridge/share';

@Injectable({
  providedIn: 'root',
})
export class ChatTemplateService {
  #client = inject(TrpcService).client;
  parseTemplate = (str: string, language?: 'js' | 'plaintext') => () => {
    return this.#client.workflow.parseTemplate
      .query({ content: str, language })
      .then((value) => {
        if (value.error) {
          return;
        }
        return [];
      });
  };
}
