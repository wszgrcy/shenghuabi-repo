import { LocationChangeListener, PlatformLocation } from '@angular/common';
import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class WebViewPlatformLocation extends PlatformLocation {
  override get href(): string {
    return '';
  }
  override get protocol(): string {
    return '';
  }
  override get hostname(): string {
    return '';
  }
  override get port(): string {
    return '';
  }
  override get pathname(): string {
    return `/${window.__pageConfig.page}`;
  }
  override get search(): string {
    return '';
  }
  override get hash(): string {
    return '';
  }
  override pushState(state: any, title: string, url: string): void {}
  override onPopState(fn: LocationChangeListener): VoidFunction {
    return () => undefined;
  }
  override forward(): void {}
  override back(): void {}
  override historyGo(relativePosition: number): void {}
  override getState(): unknown {
    return;
  }
  override getBaseHrefFromDOM(): string {
    return '';
  }
  override onHashChange(fn: LocationChangeListener): VoidFunction {
    return () => undefined;
  }
  override replaceState(state: any, title: string, url: string): void {}
}
