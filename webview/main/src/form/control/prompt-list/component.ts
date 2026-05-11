import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessageListOutputType } from '@bridge/share';
import { ChatMessageItemType } from '@shenghuabi/openai/define';
import { getHumanTemplate } from '@fe/component/chat/const';
import { PromptTemplateFCC } from '@fe/component/chat/template-form/component';
import { BaseControl } from '@piying/view-angular';

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
  addChange(index: number) {
    this.value$.update((list) => {
      list = [...list!];
      list.splice(index + 1, 0, getHumanTemplate());
      return list;
    });
    this.valueChange(this.value$());
  }
}
