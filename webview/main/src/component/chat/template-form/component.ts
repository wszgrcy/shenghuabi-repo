import { OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { deepClone } from '@bridge/share';
import { UserChatMessageType } from '@shenghuabi/openai/define';
import { MenuCheckboxFCC } from '@cyia/component/core';

import { deepEqual } from 'fast-equals';

import { MenuCheckboxOption } from '@cyia/component/core/component/menu-checkbox/type';
import { TextareaTemplateFCC } from '@fe/component/textarea-template/component';
import {
  SimpleVariableNode,
  SimplifiedState,
} from '@shenghuabi/lexical-textarea';
import { ChatVariable } from '../../../type/chat-variable';
@Component({
  selector: 'prompt-template',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatIconModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatTooltipModule,
    MenuCheckboxFCC,
    OverlayModule,
    FormsModule,
    TextareaTemplateFCC,
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
  variableChange = output<ChatVariable[]>();
  readonly PROMPT_TYPE: MenuCheckboxOption[] = [
    {
      value: 'system',
      color: 'info',
      icon: 'highlight',
      description: '修改为[系统提示词]',
      // disabled: computed(() => {
      //   return !!this.list()?.some((item) => item.type === 'system');
      // }),
    },
    {
      //user
      value: 'user',
      color: 'info',
      icon: 'account_circle',
      description: '修改为[用户提示词]',
      // disabled: computed(() => {
      //   return !!this.list()?.some((item) => item.type === 'user');
      // }),
    },
    {
      //assistant
      value: 'assistant',
      color: 'info',
      icon: 'precision_manufacturing',
      description: '修改为[模型返回]',
      // disabled: computed(() => {
      //   return !!this.list()?.some((item) => item.type === 'assistant');
      // }),
    },
    {
      value: 'system',
      color: 'success',
      icon: 'highlight',
      description: '新增[系统提示词]',
      beforeChange: async (option) => {
        this.addTemplateChange.emit(option.value);
        return false;
      },
    },
    {
      //user
      value: 'user',
      color: 'success',
      icon: 'account_circle',
      description: '新增[用户提示词]',
      beforeChange: async (option) => {
        this.addTemplateChange.emit(option.value);
        return false;
      },
    },
    {
      //assistant
      value: 'assistant',
      color: 'success',
      icon: 'precision_manufacturing',
      description: '新增[模型返回]',
      beforeChange: async (option) => {
        this.addTemplateChange.emit(option.value);
        return false;
      },
    },
  ];
  isLast = input(false);
  list = input<any[]>();
  forms = new FormGroup({
    type: new FormControl('system'),
    content: new FormControl(undefined),
    assets: new FormControl(undefined),
  });
  opened = false;
  addTemplateChange = output<any>();
  onChange = (_: any) => {};

  ngOnInit(): void {
    this.forms.valueChanges.subscribe((value) => {
      value = deepClone(value);
      if (!value.assets) {
        delete value.assets;
      }
      const contentList = [];
      if (value.content) {
        contentList.push({ text: value.content, type: 'text' });
      }
      let imageList: SimpleVariableNode | undefined;
      if (value.assets) {
        imageList = {
          type: 'variable',
          item: {
            label: '图片',
            value: [value.assets],
            type: 'custom',
          },
        };
        contentList.push({
          image_url: {
            url: [[imageList]] as SimplifiedState,
          },
          type: 'image_url',
        });
      }
      const list: ChatVariable[] = [...this.#textVarList$()];
      if (imageList) {
        list.push({ ...imageList.item, kind: 'image' });
      }
      this.variableChange.emit(list);

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
        content: obj.content.find((item) => item.type === 'text')?.text,
        assets: obj.content.find((item) => item.type === 'image_url')?.image_url
          .url,
      };
      if (!deepEqual(inputValue, this.forms.value)) {
        this.forms.patchValue(inputValue as any, { emitEvent: false });
      }
    }
  }

  registerOnTouched(fn: () => void): void {}

  registerOnChange(fn: (_: any) => any): void {
    this.onChange = fn;
  }
  #textVarList$ = signal<SimpleVariableNode['item'][]>([]);
  textVarChange(obj: any) {
    this.#textVarList$.set(obj.custom);
  }
}
