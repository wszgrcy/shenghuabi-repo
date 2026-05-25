import { Component } from '@angular/core';
import { ReactOutlet } from '@cyia/ngx-bridge/react-outlet';
import {
  AttributesDirective,
  EventsDirective,
  InsertFieldDirective,
} from '@piying/view-angular';
import { AddHandleDirective } from './add-children';
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
