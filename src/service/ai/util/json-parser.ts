import { lexer, Tokens } from 'marked';
import { parse } from 'jsonc-parser';
/** 对ai返回进行处理并格式化 */
export function jsonParse(text: string): Record<string, any> | undefined {
  try {
    try {
      const result = JSON.parse(text);
      if (typeof result === 'object') {
        return result;
      }
    } catch (error) {}

    return tryToParse(text);
  } catch (e) {
    return undefined;
  }
}
function tryToParse(text: string) {
  const node = lexer(text).find(
    (item) =>
      item.type === 'code' && (item.lang === 'json' || item.lang === 'jsonc'),
  ) as Tokens.Code | Tokens.Generic;
  try {
    const result = parse(node.text);
    if (typeof result !== 'object') {
      return undefined;
    }
    return result;
  } catch (error) {
    return undefined;
  }
}
