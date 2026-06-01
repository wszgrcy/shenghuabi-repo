import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AttributesDirective, EventsDirective } from '@piying/view-angular';
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
