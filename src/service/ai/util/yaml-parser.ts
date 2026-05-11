import { Tokens, lexer } from 'marked';
import { parse, YAMLParseError } from 'yaml';

import MS from 'magic-string';
/**
 * 文本有可能是markdown中的yml代码块,或者就是yml代码块
 */
export function yamlParse<T = any>(text: string): T | undefined {
  try {
    const parseResult = parse(text);
    if (typeof parseResult !== 'object' || Array.isArray(parseResult)) {
      return tryToParse(text);
    }
    return parseResult;
  } catch (e) {
    return tryToParse(text);
  }
}

function tryToParse(text: string) {
  const node = lexer(text).find(
    (item) =>
      item.type === 'code' && (item.lang === 'yml' || item.lang === 'yaml'),
  );
  if (node) {
    try {
      return parseOrFix((node as Tokens.Code | Tokens.Generic).text);
    } catch (error) {
      return undefined;
    }
  } else {
    return undefined;
  }
}

function parseOrFix(data: string) {
  let count = 0;
  let lastFix = 0;
  let commonFix = false;
  let commaFix = false;
  while (count < 500) {
    try {
      return parse(data);
    } catch (error) {
      count++;
      if (error instanceof YAMLParseError) {
        const { pos } = error;
        if (pos[0]) {
          if (error.code === 'DUPLICATE_KEY') {
            const testStr = data.slice(pos[0], pos[1] + 30);
            const result = testStr.match(/.+$/dm);
            if (result) {
              data =
                data.slice(0, pos[0]) +
                data.slice(pos[0] + result.indices![0][1]);
              continue;
            }
          } else {
            // \ 换行问题
            let start = pos[0] - 10;
            let testStr = data.slice(start, pos[1] + 30);
            let result = testStr.match(/\\\s+/d);
            if (result?.[0]) {
              data =
                data.slice(0, start + result.indices![0][0]) +
                data.slice(start + result.indices![0][1]);
              lastFix = start + result.indices![0][1];
              continue;
            }
            // 普通换行问题
            start = pos[0] - 1;
            testStr = data.slice(start, pos[1] + 30);
            result = testStr.match(/\s+/d);
            if (result?.[0]) {
              data =
                data.slice(0, start + result.indices![0][0]) +
                data.slice(start + result.indices![0][1]);
              lastFix = start + result.indices![0][1];
              continue;
            }
            // 最后一个的引号变成中文问题
            testStr = data.slice(start, pos[1]);
            result = testStr.match(/(“|”)\s+$/);
            if (result) {
              data =
                data.slice(0, start + result.index!) +
                '"' +
                data.slice(start + result.index! + 1);
              lastFix = start + result.index! + 1;
              continue;
            }
            if (!commonFix) {
              const dQuotaReg = new RegExp(
                `^\\s+(?:-\\s+)?(?:\\w+):\\s".+(”)(?:\\s+)?$`,
                'dgm',
              );
              testStr = data.slice(lastFix);
              const ms = new MS(testStr);
              while ((result = dQuotaReg.exec(testStr))) {
                ms.update(result.indices![1][0], result.indices![1][1], '"');
              }
              data = data.slice(0, lastFix) + ms.toString();
              commonFix = true;
              continue;
            }
            if (!commaFix) {
              const dQuotaReg = new RegExp(
                `^\\s+(?:-\\s+)?(?:\\w+)(：)(\\s)?.+$`,
                'dgm',
              );
              testStr = data.slice(lastFix);
              const ms = new MS(testStr);
              while ((result = dQuotaReg.exec(testStr))) {
                ms.update(result.indices![1][0], result.indices![1][1], ':');
                if (!result[2]) {
                  ms.appendLeft(result.indices![1][1], ' ');
                }
              }
              data = data.slice(0, lastFix) + ms.toString();
              commaFix = true;
              continue;
            }
          }
        }
      }
      throw error;
    }
  }
  throw new Error(`尝试次数过多`);
}
