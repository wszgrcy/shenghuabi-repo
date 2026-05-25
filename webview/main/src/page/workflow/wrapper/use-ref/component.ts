import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { isValidConnection } from '@fe/component/flow-base/flow-base.service';
import {
  AttributesDirective,
  EventsDirective,
  InsertFieldDirective,
  PI_VIEW_FIELD_TOKEN,
} from '@piying/view-angular';
import { Handle, Position } from '@xyflow/react';
import { NodeService } from '../../custom-node/formly-common-node/node.service';
import { BridgeService } from '../../service';
import { ReactOutlet } from '@cyia/ngx-bridge/react-outlet';
import { AddHandleDirective } from '../handle/add-children';
import { BaseHandleDirective } from '../base.handle.component';
@Component({
  selector: 'app-use-ref',
  templateUrl: './component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AttributesDirective,
    EventsDirective,
    ReactOutlet,
    AddHandleDirective,
  ],
})
export class UseRefWC extends BaseHandleDirective {
  static readonly __version = 2;
}
