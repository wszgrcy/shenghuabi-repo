import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';

interface MenuGroupItem {
  group?: boolean;
  children?: MenuGroupItem[];
  label: string;
  data?: Record<string, any>;
}

@Component({
  selector: 'menu-group',
  templateUrl: './component.html',
  standalone: true,
  imports: [MatMenuModule, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuGroupComponent {
  groupList = input.required<MenuGroupItem[]>();
  callbackGroup = input.required<Record<string, any>>();
  constructor() {}
}
