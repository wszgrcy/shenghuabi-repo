import {
  createInjector,
  createRootInjector,
  Injector,
  INJECTOR_SCOPE,
} from 'static-injector';
import { ExtensionContext } from '../../src/token';

export function getInjectEnv() {
  return createRootInjector({
    providers: [
      {
        provide: ExtensionContext,
        useValue: {
          extensionPath: 'xxxxx',
        },
      },
    ],
  });
}
