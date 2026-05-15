import { Component, inject, viewChild } from '@angular/core';
import {
  ReactOutlet,
  RootReactOutletToken,
} from '@cyia/ngx-bridge/react-outlet';
import {
  AttributesDirective,
  EventsDirective,
  InsertFieldDirective,
} from '@piying/view-angular';
import { Handle } from '@xyflow/react';
import { BridgeService } from '../../service';
@Component({
  selector: 'app-handle-wrapper',
  templateUrl: './component.html',
  imports: [
    AttributesDirective,
    InsertFieldDirective,
    EventsDirective,
    ReactOutlet,
  ],
})
export class HandleWC {
  static readonly __version = 2;
  readonly templateRef = viewChild.required('templateRef');
  readonly Handle = Handle;
  readonly service = inject(BridgeService);
  readonly parent = this.service.rootReactOutlet;

}
