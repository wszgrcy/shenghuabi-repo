const list = [
  { value: '\n\n\n\n', keep: false, force: true },
  { value: '\n\n\n', keep: false, force: true },
  { value: '\n\n', keep: false, force: true },
  { value: ' \n\n', keep: false, force: true },
  { value: '\n', keep: false, force: true },
  { value: ' \n', keep: false, force: true },
  { value: '……', keep: true },
  { value: '。」', keep: true },
  { value: '！」', keep: true },
  { value: '？」', keep: true },
  { value: '。”', keep: true },
  { value: '！”', keep: true },
  { value: '？”', keep: true },
  { value: '。', keep: true },
  { value: '！', keep: true },
  { value: '？', keep: true },
  { value: ' ', keep: true },
];
/** 句子切割 */
function sentenceSplit(str: string, length: number) {
  return new Sentence(str, length).parse();
}
class Sentence {
  #str;
  /** 分割点 */
  #selectPointList: { end: number }[][] = [];
  /** 分段索引 */
  #index = 0;
  constructor(
    str: string,
    public length: number,
  ) {
    this.#str = str;
  }
  parse() {
    for (let i = 0; i < this.#str.length; i++) {
      i = this.#getSplitPos(i);
    }
    // 加上最后一句（如果没匹配上）
    if (this.#lastStart !== this.#str.length) {
      this.#selectPointList[this.#index] ??= [{ end: this.#lastStart }];
      this.#selectPointList[this.#index].push({ end: this.#str.length });
    }
    const list = [];
    for (let index = 0; index < this.#selectPointList.length; index++) {
      list.push(...this.#mergeList(this.#selectPointList[index]));
    }
    return list.map((item) => {
      return { ...item, content: this.#str.slice(item.start, item.end) };
    });
  }
  #mergeList(list: { end: number }[]) {
    if (list.length === 2) {
      return [{ start: list[0].end, end: list[1].end }];
    }
    const subList = list;
    /* 上一个分割点 */
    let lastSplitItem;
    /** 上一个item */
    let lastItem: { percent: number; end: number; index: number } | undefined;
    const result = [];

    for (let j = 0; j < subList.length; j++) {
      const item = subList[j];
      if (!lastSplitItem) {
        lastSplitItem = item;
      } else {
        let percent = (item.end - lastSplitItem.end) / this.length;
        percent = percent > 1 ? percent - 1 : percent;
        if (item.end - lastSplitItem.end < this.length) {
          lastItem = { percent: percent, index: j, end: item.end };
        } else {
          if (item.end - lastSplitItem.end > this.length) {
            if (!lastItem || lastItem.percent > percent) {
              result.push({ start: lastSplitItem.end, end: item.end });
              lastSplitItem = item;
            } else {
              result.push({ start: lastSplitItem.end, end: lastItem.end });
              lastSplitItem = lastItem;
              j--;
            }
          } else {
            result.push({ start: lastSplitItem.end, end: item.end });
            lastSplitItem = item;
          }
          lastItem = undefined;
        }
      }
    }
    if (lastSplitItem && lastItem) {
      result.push({ start: lastSplitItem.end, end: lastItem.end });
    }
    return result;
  }
  #lastStart = 0;
  #getSplitPos(index: number) {
    for (let j = 0; j < list.length; j++) {
      const tryToMatched = list[j];
      const endIndex = index + tryToMatched.value.length;
      if (
        endIndex <= this.#str.length &&
        this.#str.slice(index, endIndex) === tryToMatched.value
      ) {
        this.#selectPointList[this.#index] ??= [{ end: this.#lastStart }];
        if (!tryToMatched.keep) {
          const lastItem = this.#selectPointList[this.#index].slice().pop();
          // 不保留可能与前一个相同， 比如 换行和。一般是连着的
          if (lastItem?.end !== index) {
            this.#selectPointList[this.#index].push({
              end: index,
            });
          }
        } else {
          this.#selectPointList[this.#index].push({
            end: endIndex,
          });
        }
        if (tryToMatched.force) {
          if (this.#selectPointList[this.#index]) {
            this.#index++;
          }
        }
        this.#lastStart = endIndex;
        return endIndex - 1;
      }
    }
    return index;
  }
}

// todo 去掉把
export function everyLine(str: string) {
  const a = /(\s+)?(\r\n|\n)(\s+)?/dg;
  let match: RegExpExecArray | null;
  let list = [];
  let start = 0;
  while ((match = a.exec(str))) {
    const end = match.indices![0][0];
    const content = str.slice(start, end);
    const inputStart = start;
    start = match.indices![0][1];
    if (!content.trim()) {
      continue;
    }
    list.push({
      start: inputStart,
      end: match.indices![0][0],
      content: content,
    });
  }
  if (start !== str.length) {
    if (str.length && !list.length) {
      list = [{ start: 0, end: str.length, content: str }];
    } else {
      const content = str.slice(start, str.length).trim();
      if (content) {
        list.push({ start, end: start + content.length, content: content });
      }
    }
  }
  // todo 可以优化
  return list.map((item) => {
    const startOffset = item.content.length - item.content.trimStart().length;
    const endOffset = item.content.length - item.content.trimEnd().length;
    return {
      start: item.start + startOffset,
      end: item.end - endOffset,
      content: item.content.trim(),
    };
  });
}
/** 把字符串按回车分割为每行,并且只保留有内容的 */
export function splitStrLine(content: string) {
  const lintReg = /(?:\r\n|\n)+/dg;
  const list: { content: string; start: number; end: number }[] = [];
  let result;
  let index = 0;
  while ((result = lintReg.exec(content))) {
    const subContent = content.slice(index, result.indices![0][0]);
    const leftTrim = subContent.trimStart();
    const trimedContent = leftTrim.trimEnd();
    if (trimedContent) {
      list.push(
        createLineItem(
          trimedContent,
          index + (subContent.length - leftTrim.length),
        ),
      );
    }
    index = result.indices![0][1];
  }
  if (content.length !== index) {
    const subContent = content.slice(index);
    const leftTrim = subContent.trimStart();
    const trimedContent = leftTrim.trimEnd();
    if (trimedContent) {
      list.push(
        createLineItem(
          trimedContent,
          index + (subContent.length - leftTrim.length),
        ),
      );
    }
  }
  return list;
}
function createLineItem(content: string, start: number) {
  return {
    content,
    start,
    end: start + content.length,
  };
}
