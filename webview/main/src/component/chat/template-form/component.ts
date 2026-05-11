import { OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { deepClone } from '@bridge/share';
import {
  ChatCompletionContentPartImage,
  ChatCompletionContentPartStr,
  UserChatMessageType,
} from '@shenghuabi/openai/define';
import { MenuCheckboxFCC, SpanInputFCC } from '@cyia/component/core';

import { deepEqual } from 'fast-equals';

import * as v from 'valibot';

@Component({
  selector: 'prompt-template',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatTooltipModule,
    MenuCheckboxFCC,
    SpanInputFCC,
    OverlayModule,
    MatFormFieldModule,
    FormsModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PromptTemplateFCC),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptTemplateFCC implements ControlValueAccessor {
  disableImage = input(false);
  readonly PROMPT_TYPE: any[] = [
    {
      value: 'system',
      color: 'primary',
      icon: 'highlight',
      description: '系统提示词',
      disabled: computed(() => {
        return !!this.list()?.some((item) => item.type === 'system');
      }),
    },
    {
      //user
      value: 'user',
      color: 'accent',
      icon: 'account_circle',
      description: '用户提示词',
    },
    {
      //assistant
      value: 'assistant',
      color: 'accent',
      icon: 'precision_manufacturing',
      description: '模型返回',
    },
  ];
  isLast = input(false);
  list = input<any[]>();
  forms = new FormGroup({
    type: new FormControl('system'),
    content: new FormControl(''),
    assets: new FormControl(''),
  });
  opened = false;
  addTemplateChange = output();
  onChange = (_: any) => {};

  ngOnInit(): void {
    this.forms.valueChanges.subscribe((value) => {
      value = deepClone(value);
      if (!value.assets) {
        delete value.assets;
      }
      const contentList = [];
      if (value.content) {
        contentList.push(
          v.parse(ChatCompletionContentPartStr, { text: value.content }),
        );
      }
      if (value.assets) {
        contentList.push(
          v.parse(ChatCompletionContentPartImage, {
            image_url: { url: value.assets },
          }),
        );
      }
      this.onChange({
        role: value.type,
        content: contentList,
      } as UserChatMessageType);
    });
  }
  writeValue(obj: UserChatMessageType): void {
    if (obj) {
      const inputValue = {
        type: obj.role,
        content: obj.content.find((item) => item.type === 'text')?.text ?? '',
        assets:
          obj.content.find((item) => item.type === 'image_url')?.image_url
            .url ?? '',
      };
      if (!deepEqual(inputValue, this.forms.value)) {
        this.forms.patchValue(inputValue, { emitEvent: false });
      }
    }
  }

  registerOnTouched(fn: () => void): void {}

  registerOnChange(fn: (_: any) => any): void {
    this.onChange = fn;
  }
}
