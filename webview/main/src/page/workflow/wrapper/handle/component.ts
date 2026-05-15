import {
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  portalChildren,
  ReactOutlet,
  RootReactOutletToken,
} from '@cyia/ngx-bridge/react-outlet';
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
import { MergeClassPipe } from '@piying-lib/angular-daisyui/pipe';
@Component({
  selector: 'app-handle-wrapper',
  templateUrl: './component.html',
  imports: [
    AttributesDirective,
    InsertFieldDirective,
    EventsDirective,
    ReactOutlet,
    AddHandleDirective,
    MergeClassPipe,
  ],
})
export class HandleWC {
  static readonly __version = 2;
  readonly templateRef = viewChild.required('templateRef');
  readonly Handle = Handle;
  field$$ = inject(PI_VIEW_FIELD_TOKEN);
  bridge = inject(BridgeService);
  nodeService = inject(NodeService);
  id = `input:${this.field$$().form.control!.valuePath.join('-')}`;
  props = {
    className: 'relative! w-full! h-auto! top-0! left-0! transform-none!',
    type: 'target',
    position: Position.Left,
    id: this.id,
  };
  linkedEdge$$ = computed(() => {
    let list = this.bridge.edges();
    let props = this.nodeService.props$();
    return list.find(
      (item) => props.id === item.target && this.id === item.targetHandle,
    );
  });
  isUsed$$ = computed(() => {
    return !!this.linkedEdge$$();
  });
  constructor() {}
  unLink() {
    let edge = this.linkedEdge$$()!;
    this.bridge.instance()?.deleteElements({ edges: [edge] });
  }
}
