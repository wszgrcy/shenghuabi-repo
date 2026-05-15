import { Component, computed, inject, signal, viewChild } from '@angular/core';
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
  id = `input:${this.field$$().form.control!.valuePath.join('-')}`;
  props = {
    className: '',
    type: 'target',
    position: Position.Top,
    id: this.id,
  };
}
