import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommandButtonComponent } from '@fe/component/external-document/command-button/component';
import { InstallCheckComponent } from './install-check/component';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [CommandButtonComponent, InstallCheckComponent],
  styleUrl: './component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class QuickPickComponent {}
