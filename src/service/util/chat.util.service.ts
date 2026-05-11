import { inject, RootStaticInjectOptions } from 'static-injector';
import { ChatMetadata } from '../ai/knowledge-base/type';
import { isTruthy } from '@share/util/is-truthy';
import { TemplateFormatService } from '@shenghuabi/workflow';

export class ChatUtilService extends RootStaticInjectOptions {
  #format = inject(TemplateFormatService);
  interpolate = this.#format.interpolate;
  /** 获得引用 */
  getMetadataEndRef(list?: ChatMetadata[]) {
    if (!list || !list.length) {
      return undefined;
    }
    const result = list
      .map((item, index) =>
        item.reference?.type === 'url'
          ? `[${index}]: ${item.reference.url}`
          : undefined,
      )
      .filter(isTruthy);
    if (!list.length) {
      return undefined;
    }
    return '\n\n' + result.join('\n\n');
  }
}
