import { ChatDataType } from '../mind';

const keyMap = { system: '系统', user: '用户', assistant: '回复' };
export function formatChat(data: ChatDataType['value']) {
  const lLength = data.list.length;
  const last = lLength ? data.list[lLength - 1] : undefined;
  return (
    last?.historyList?.map((item: any) => {
      return `- **${(keyMap as any)[item[0]]}** ${item[1]}`;
    }) || []
  ).join('\n');
}
