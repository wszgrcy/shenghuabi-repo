import { InjectionToken } from '@angular/core';
export interface CustomLinkApi {
  openArticle: (filePath: string) => void;
  moveTo: (input: { id: string }) => void;
  getCardNode: () => Promise<any[]>;
}
export const CustomLinkApiToken = new InjectionToken<CustomLinkApi>(
  'CustomLinkApi',
);
