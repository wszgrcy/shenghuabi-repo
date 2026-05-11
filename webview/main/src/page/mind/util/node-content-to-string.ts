import { MindNode } from '@bridge/share';
import { htmlToText } from 'html-to-text';

export function nodeContentToString(item: MindNode) {
  if (item.type === 'card') {
    return item.data['value']?.html ? htmlToText(item.data['value'].html) : '';
  } else if (item.type === 'chat') {
    const list: any[] = item.data['value']?.list || [];
    return list.length
      ? htmlToText(
          list
            .map((item) => {
              return `${Array.isArray(item.input) ? item.input.find((item: any) => item.type === 'text').text : item.input}-${item.result}`;
            })
            .join('\n'),
        )
      : '';
  }
  return '';
}
