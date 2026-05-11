import { Clipboard } from '@angular/cdk/clipboard';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  host: {
    class: 'menu-minimum',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuContextComponent {
  props = input.required<any>();

  clip = inject(Clipboard);
  constructor() {}
  copyCell() {
    this.clip.copy(this.props().getTextContent());
  }
}
