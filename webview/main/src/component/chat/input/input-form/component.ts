import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  output,
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SkipEnterDirective } from '../../../../directive/skip-enter.directive';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { ImageBase64InputComponent } from '@fe/component/image-base64-input/component';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';

import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatNodeService } from '../../../../domain/chat-node/chat-node.service';
import { WorkflowContextConfig } from '@shenghuabi/workflow/share';
import { BaseControl } from '@piying/view-angular';
import { get, set } from 'es-toolkit/compat';

@Component({
  selector: 'context-form',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    SkipEnterDirective,
    PurePipe,
    ImageBase64InputComponent,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFormComponent),
      multi: true,
    },
    ChatNodeService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFormComponent extends BaseControl {
  /** 每个输入值的类型 */
  inputList = input<WorkflowContextConfig[]>();

  switchObject: Record<string, boolean> = {};
  // todo mind中使用,未来应该要加上
  /** 如果从其他地方输入,那么禁用这个值不允许编辑 */
  // disableInputObject = input.required<Record<string, boolean>>();
  /** 好像是回车直接对话,但是shift+回车就不对话 */
  keyEnter = output();

  keypressEnter() {
    this.keyEnter.emit();
  }
  inputType = (item: WorkflowContextConfig) => {
    return item.kind ?? 'string';
  };
  inputValue = (value: any, key: any) => {
    return get(value, key);
  };

  stopDefault(e: MouseEvent) {
    e.stopPropagation();
  }
  valueChange2(key: any, value: any) {
    this.value$.update((data) => {
      data = { ...data };
      set(data, key, value);
      return data;
    });
    this.valueAndTouchedChange(this.value$());
  }
}
