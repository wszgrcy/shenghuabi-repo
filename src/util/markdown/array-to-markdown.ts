export function arrayToTable(array: any[], headers: string[], title?: string) {
  if (!array.length) {
    return '';
  }
  let table = `${title ? title + '\n' : ''}${headers.join(' | ')}\n`;
  table += headers.map(() => '---').join(' | ');
  table += '\n';
  array.forEach((item) => {
    table += headers.map((_, index) => item[index]).join(' | ') + '\n';
  });

  return table;
}
