import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { NODE_ITEM } from '../../../card-editor.service';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatMenuModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateNodeMenuComponent {
  props = input.required<any>();

  onSelect(data: NODE_ITEM) {
    this.props().selectOptionAndCleanUp(data);
  }
}
