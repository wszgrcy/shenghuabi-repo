import { FileParser } from '@shenghuabi/knowledge/file-parser';
import { FileTypeResult } from 'file-type';
import { inject, RootStaticInjectOptions } from 'static-injector';
import { OCRService } from '../external-call/ocr.service';
import { path } from '@cyia/vfs2';
import { isUndefined } from 'lodash-es';
import { LogFactoryService } from '../log.service';

export class ImageParserService
  extends RootStaticInjectOptions
  implements FileParser
{
  #ocr = inject(OCRService);
  priority: number = 1;
  #log = inject(LogFactoryService).getLog('ocr');
  async parse(
    fileName: string,
    buffer: Uint8Array | ArrayBuffer,
    type: FileTypeResult | undefined,
  ): Promise<{ title: any; content: string }[] | undefined> {
    if (type?.mime.startsWith(`image`)) {
      const baseName = path.basename(fileName, path.extname(fileName));
      const result = await this.#ocr.autoConvert(new Uint8Array(buffer));
      if (isUndefined(result)) {
        this.#log.warn('未安装OCR');
        return undefined;
      }
      return [
        {
          title: baseName,
          content: result,
        },
      ];
    }
    return undefined;
  }
}
