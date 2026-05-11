import { Pipe, PipeTransform } from '@angular/core';
import { CHAT_ITEM_TYPE } from '@bridge/share';

@Pipe({ name: 'getChatItemContent', standalone: true })
export class GetChatItemContentPipe implements PipeTransform {
  transform(value: CHAT_ITEM_TYPE): string {
    if (typeof value === 'string') {
      return value;
    } else {
      return value.find((item) => item.type === 'text')?.text!;
    }
  }
}
