import { Component, input } from '@angular/core';
import {
  MatProgressBarModule,
  ProgressBarMode,
} from '@angular/material/progress-bar';
export interface ProgressInfo {
  message?: string;
  value?: number;
  type?: string;
}
@Component({
  selector: 'app-process',
  templateUrl: './component.html',
  imports: [MatProgressBarModule],
})
export class ProgressComponent {
  color = input<string>();
  mode = input<ProgressBarMode>('buffer');
  info = input<ProgressInfo | undefined>();
}
