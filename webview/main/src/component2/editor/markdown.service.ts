import { inject, Injectable, Injector } from '@angular/core';
import { CardEditorService } from './card-editor.service';
import { PLAYGROUND_TRANSFORMERS } from './plugin/MarkdownTransformers';
import { type Transformer } from '@lexical/markdown';

@Injectable()
export class MarkdownService {
  #service = inject(CardEditorService);
  #injector = inject(Injector);
  getTransformers(root?: string) {
    return [
      ...PLAYGROUND_TRANSFORMERS,
      ...this.#service
        .plugins()
        .map((item) => item.markdownToNode(this.#injector, root)),
    ] as Transformer[];
  }
}
