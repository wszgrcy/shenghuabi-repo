export function searchHighLight(content: string | undefined, word: string) {
  if (!content) {
    return undefined;
  }
  const index = content.indexOf(word);
  if (index == -1) {
    return undefined;
  } else {
    let start = content.slice(index - 13, index);
    if (start.length !== index) {
      start = `...${start}`;
    }
    const hWord = `<span class="findInFileMatch">${word}</span>`;
    const end = content.slice(index + word.length, index + word.length + 13);
    return `${start}${hWord}${end}`;
  }
}
