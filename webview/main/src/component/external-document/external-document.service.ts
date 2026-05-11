import {
  Injectable,
  Injector,
  inject,
  reflectComponentType,
} from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { CommandButtonComponent } from './command-button/component';
import { HelpSearchComponent } from './help-search/component';
@Injectable()
export class ExternalDocumentService {
  #injector = inject(Injector);
  init() {
    const element = createCustomElement(CommandButtonComponent, {
      injector: this.#injector,
    });
    customElements.define(
      reflectComponentType(CommandButtonComponent)!.selector,
      element,
    );
    const element2 = createCustomElement(HelpSearchComponent, {
      injector: this.#injector,
    });
    customElements.define(
      reflectComponentType(HelpSearchComponent)!.selector,
      element2,
    );
  }
}
