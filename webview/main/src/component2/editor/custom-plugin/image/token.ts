import { InjectionToken } from '@angular/core';
export interface ImageApi {
  convertSrc: (filePath: string) => string;
}
export const ImageApiToken = new InjectionToken<ImageApi>('ImageApi');
