import { Component, computed, inject, viewChild } from '@angular/core';
import { ReactOutlet } from '@cyia/ngx-bridge/react-outlet';
import {
  AttributesDirective,
  EventsDirective,
  InsertFieldDirective,
} from '@piying/view-angular';
import { Handle, Position } from '@xyflow/react';
import { BridgeService } from '../../service';
import { PI_VIEW_FIELD_TOKEN } from '@piying/view-angular-core';
import { AddHandleDirective } from './add-children';
import { NodeService } from '../../custom-node/formly-common-node/node.service';
@Component({
  selector: 'app-handle-wrapper',
  templateUrl: './component.html',
  imports: [
    AttributesDirective,
    InsertFieldDirective,
    EventsDirective,
    ReactOutlet,
    AddHandleDirective,
  ],
})
export class HandleWC {
  static readonly __version = 2;
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
        'relative! w-full! h-auto! top-0! left-0! transform-none! rounded-none!  bg-transparent!',
      type: 'target',
      position: Position.Left,
      id: this.#handleId$$(),
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
