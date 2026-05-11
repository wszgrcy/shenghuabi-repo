import { HtmlToTextOptions, htmlToText } from 'html-to-text';
import { innerText } from 'domutils';
import { v4 } from 'uuid';
import MS from 'magic-string';

function _html2Text(text: string, useOcr: boolean) {
  const options: HtmlToTextOptions = {
    formatters: {
      anchor: (elem, walk, builder, formatOptions) => {
        const a = innerText(elem as any);
        builder.addInline(a, { noWordTransform: true });
      },
    },
  };
  const imageObject = {} as Record<string, string>;
  if (useOcr) {
    options.formatters!['image'] = (elem, walk, builder, formatOptions) => {
      const src = elem.attribs?.src as string | undefined;
      if (!src) {
        return;
      }
      const id = v4();
      imageObject[id] = src;
      builder.addInline(`__{{${id}}}__`, { noWordTransform: true });
    };
  } else {
    options.formatters!['image'] = (elem, walk, builder, formatOptions) => {};
  }
  return {
    text: htmlToText(text, options),
    imageObject,
  };
}
async function ocrImage(
  imageId2Path: Record<string, string>,
  ocrFn: (str: string) => Promise<string>,
) {
  const obj: Record<string, string> = {};
  for (const key in imageId2Path) {
    const filePath = imageId2Path[key];

    obj[key] = await ocrFn(filePath);
  }
  return obj;
}
function replaceImage(text: string, imageId2Text: Record<string, string>) {
  const reg = /__{{([0-9a-z\-]{36})}}__/dg;
  if (!Object.keys(imageId2Text).length) {
    return text;
  }
  let match: RegExpExecArray | null;
  const ms = new MS(text);

  while ((match = reg.exec(text))) {
    const range = match.indices![0];
    ms.update(range[0], range[1], imageId2Text[match[1]] || '');
  }
  return ms.toString();
}
export async function html2Text(
  html: string,
  config: {
    useOcr: boolean;
    ocrFn: (data: string) => Promise<string>;
  },
) {
  const { text, imageObject } = _html2Text(html, config.useOcr);
  if (config.useOcr) {
    const obj = await ocrImage(imageObject, config.ocrFn);
    return replaceImage(text, obj);
  }
  return text;
}
