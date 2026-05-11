import { lexer } from 'marked';

export function isMarkdown(content: string) {
  const list = lexer(content);
  return {
    element: !(list.length === 1 && list[0].type === 'paragraph'),
    oneLine:
      list.length === 1 &&
      list[0].type === 'paragraph' &&
      (list[0].tokens?.length ?? 0) > 1,
  };
}
