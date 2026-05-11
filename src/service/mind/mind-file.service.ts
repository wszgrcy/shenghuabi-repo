import { inject, Injector, RootStaticInjectOptions } from 'static-injector';
import { path } from '@cyia/vfs2';
import { MindData } from '../../share';
import { MindFile } from '@cyia/bundle-file';

export class MindFileService extends RootStaticInjectOptions {
  #fileMap = new Map<string, MindFile<MindData>>();
  #injector = inject(Injector);
  getFile(filePath: string) {
    const nFilePath = path.normalize(filePath);
    let file = this.#fileMap.get(nFilePath);
    if (!file) {
      file = new MindFile<MindData>(nFilePath);
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
