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
import { isValidConnection } from '@fe/component/flow-base/flow-base.service';
import { BaseHandleDirective } from '../base.handle.component';
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
export class HandleWC extends BaseHandleDirective {
  static readonly __version = 2;
}
