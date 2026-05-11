import { Tokens, lexer } from 'marked';

/** 对ai返回进行处理并格式化 */
export function markdownParse(text: string): string {
  try {
    const result = lexer(text);
    // todo markdown是否太严格?
    const node = result.find(
      (item) => item.type === 'code' && item.lang === 'markdown',
    );
    if (node) {
      return (node as Tokens.Code | Tokens.Generic).text;
    } else {
      return text;
    }
  } catch (e) {
    return text;
  }
}
