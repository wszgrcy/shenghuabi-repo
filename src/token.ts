import {
  inject,
  InjectionToken,
  Injector,
  Signal,
  ProviderToken,
  computed,
} from 'static-injector';
import type * as vscode from 'vscode';
export const ExtensionContext = new InjectionToken<vscode.ExtensionContext>(
  'ExtensionContext',
);
// export const WebviewPanelToken = new InjectionToken<vscode.WebviewPanel>(
//   'WebviewPanel',
// );
export const UriFolderToken = new InjectionToken<vscode.Uri>('UriFolder');
// export const WorkspaceServiceToken = new InjectionToken<WorkspaceService>(
//   'WorkspaceServiceToken',
// );
/** 选中文件的uri, */
export const UriFileToken = new InjectionToken<vscode.Uri>('UriFileToken');

export const CoreInjectorToken = new InjectionToken<Injector>('coreInjector');

export const DynamicInjectToken = new InjectionToken<Signal<Injector>>(
  'DynamicInject',
);

export function dynamicInject<T>(type: ProviderToken<T>) {
  const injector = inject(DynamicInjectToken);
  return computed(() => injector().get(type));
}
export function contextDynamicInject<T>(
  injector: Injector,
  type: ProviderToken<T>,
) {
  const dinjector = injector.get(DynamicInjectToken);
  return dinjector().get(type);
}
