import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
// 显示变量输入
@Component({
  selector: 'workflow-input',
  templateUrl: './component.html',
  imports: [KeyValuePipe, MatChipsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowInputComponent {
  inputValue = input.required<Record<string, any>>();
}
