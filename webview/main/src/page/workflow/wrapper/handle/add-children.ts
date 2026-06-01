import { Directive, inject, input } from '@angular/core';
import { NodeService } from '../../custom-node/formly-common-node/node.service';

@Directive({
  selector: '[addHandle]',
})
export class AddHandleDirective {
  addHandle = input.required();
  #nodeService = inject(NodeService);
  ngOnInit(): void {
    this.#nodeService.add(this.addHandle());
  }
}
