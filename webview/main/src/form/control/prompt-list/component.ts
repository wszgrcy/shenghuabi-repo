import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  output,
} from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessageListOutputType } from '@bridge/share';
import { ChatMessageItemType } from '@shenghuabi/openai/define';
import { PromptTemplateFCC } from '@fe/component/chat/template-form/component';
import { BaseControl } from '@piying/view-angular';
import { ChatVariable } from '../../../type/chat-variable';
@Component({
  selector: 'prompt-list',
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [PromptTemplateFCC, FormsModule, MatIconModule, MatButtonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PromptListFCC),
      multi: true,
    },
  ],
})
export class PromptListFCC extends BaseControl<ChatMessageListOutputType> {
  variableChange = output<ChatVariable[]>();
  promptChange(item: ChatMessageItemType, index: number) {
    this.value$.update((value) => {
      value = [...value!];
      value[index] = item;
      return value;
    });
    this.valueChange(this.value$());
  }
  promptRemove(index: number) {
    this.value$.update((value) => {
      value = [...value!];
      value.splice(index, 1);
      return value;
    });
    this.valueChange(this.value$());
  }
  addChange(role: string, index: number) {
    this.value$.update((list) => {
      list = [...(list ?? [])!];
      list.splice(index + 1, 0, { role: role as any, content: [] });
      return list;
    });
    this.valueChange(this.value$());
  }
  #list: ChatVariable[][] = [];
  varChanged(list: ChatVariable[], index: number) {
    this.#list[index] = list;
    this.variableChange.emit(this.#list.filter(Boolean).flat());
  }
}
