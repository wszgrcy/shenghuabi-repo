import { Component, computed, input } from '@angular/core';
import { MergeClassPipe } from '@piying-lib/angular-core';

export interface ProgressInfo {
  message?: string;
  value?: number;
  type?: string;
}
@Component({
  selector: 'app-process',
  templateUrl: './component.html',
  imports: [MergeClassPipe],
})
export class ProgressComponent {
  info = input<ProgressInfo | undefined>();
  color = computed(() => {
    let type = this.info()?.type;
    if (!type) {
      return 'info';
    } else if (type === 'error') {
      return 'error';
    } else if (type === 'end') {
      return 'success';
    }
    return 'info';
  });
  colorClass$$ = computed(() => {
    return `progress-${this.color()}`;
  });
}
