import { computed, Directive, inject, viewChild } from '@angular/core';
import { isValidConnection } from '@fe/component/flow-base/flow-base.service';
import { PI_VIEW_FIELD_TOKEN } from '@piying/view-angular';
import { Handle, Position } from '@xyflow/react';
import { NodeService } from '../custom-node/formly-common-node/node.service';
import { BridgeService } from '../service';
@Directive()
export class BaseHandleDirective {
  readonly templateRef = viewChild.required('templateRef');
  readonly Handle = Handle;
  field$$ = inject(PI_VIEW_FIELD_TOKEN);
  #bridge = inject(BridgeService);
  #nodeService = inject(NodeService);
  #fieldPath$$ = computed(() => {
    return this.field$$().form.control!.fieldPath.join('-');
  });
  readonly #id$$ = computed(() => this.#nodeService.props$().id);
  readonly #handleId$$ = computed(() => {
    return `input:${this.#fieldPath$$()}`;
  });
  readonly props$$ = computed(() => {
    return {
      className:
        'relative! w-full! h-auto! top-0! left-0! transform-none! rounded-none!  bg-transparent! pointer-events-auto!',
      type: 'target',
      position: Position.Left,
      id: this.#handleId$$(),
      isValidConnection: isValidConnection,
      isConnectableStart: false,
    };
  });
  #linkedEdge$$ = computed(() => {
    return this.#bridge.edgeTargetObj$$()[this.#id$$()]?.[this.#handleId$$()];
  });
  isUsed$$ = computed(() => {
    return !!this.#linkedEdge$$();
  });
  constructor() {
    this.#nodeService.addCanLinkId(this.#handleId$$(), this.field$$);
  }
  unLink() {
    const edge = this.#linkedEdge$$()!;
    this.#bridge.instance()?.deleteElements({ edges: [edge] });
  }
  ngOnDestroy(): void {
    this.#nodeService.removeCanLinkId(this.#handleId$$());
  }
}
