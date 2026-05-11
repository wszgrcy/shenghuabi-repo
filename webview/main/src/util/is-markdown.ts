import { lexer } from 'marked';

export function isMarkdown(content: string) {
  const list = lexer(content);
  return !(
    list.length === 1 &&
    list[0].type === 'paragraph' &&
    list[0].tokens?.length === 1 &&
    list[0].tokens[0].type === 'text'
  );
}
