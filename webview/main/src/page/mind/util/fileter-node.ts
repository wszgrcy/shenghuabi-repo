import { MindNode } from '@bridge/share';
import { searchHighLight } from '@fe/util/search-highlight';
import { nodeContentToString } from './node-content-to-string';

export function filterNodeByString(list: MindNode[], value: string) {
  return list.map((item) => {
    if (item.type === 'card') {
      const title = item.data['title'];
      const content = item.data['value']?.html || '';
      if (title || content) {
        const hTitle = searchHighLight(title, value);
        const hContent = searchHighLight(nodeContentToString(item), value);
        if (!hTitle && !hContent) {
          return false;
        }
        return {
          label: searchLabel(title || `[未命名]`, hTitle, hContent),
          type: item.type,
          value: item,
        };
      }

      return false;
    } else if (item.type === 'chat') {
      const title = item.data['title'];
      const list: any[] = item.data['value']?.list || [];
      if (title || list.length) {
        const hTitle = searchHighLight(title, value);
        const hContent = searchHighLight(nodeContentToString(item), value);
        if (!hTitle && !hContent) {
          return false;
        }

        return {
          label: searchLabel(title || `[未命名]`, hTitle, hContent),
          type: item.type,
          value: item,
        };
      }
      return false;
    } else {
      return false;
    }
  });
}
function searchLabel(defaultTitle: string, title?: string, content?: string) {
  if (title && !content) {
    return `${title || defaultTitle || ''}`;
  } else {
    return `${title || defaultTitle || ''}-${content}`;
  }
}
