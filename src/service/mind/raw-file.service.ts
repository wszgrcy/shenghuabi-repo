import { inject, Injector, RootStaticInjectOptions } from 'static-injector';
import { path } from '@cyia/vfs2';
import { RawFile } from '@cyia/bundle-file';
/** tts 用 */
export class RawFileService extends RootStaticInjectOptions {
  #fileMap = new Map<string, RawFile>();
  #injector = inject(Injector);
  getFile(filePath: string) {
    const nFilePath = path.normalize(filePath);
    let file = this.#fileMap.get(nFilePath);
    if (!file) {
      file = new RawFile(nFilePath);
      this.#fileMap.set(nFilePath, file);
    }
    return file;
  }
  remove(filePath: string) {
    const nFilePath = path.normalize(filePath);
    const file = this.#fileMap.get(nFilePath);
    if (!file) {
      return;
    }
    file.close();
    this.#fileMap.delete(nFilePath);
  }
}
