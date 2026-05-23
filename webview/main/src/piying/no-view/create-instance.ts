import { Injectable, Injector } from '@angular/core';
import {
  _PiResolvedCommonViewFieldConfig,
  CoreSchemaHandle,
  FormBuilder,
} from '@piying/view-angular-core';
import { SchemaOrPipe } from '@piying/valibot-visit';
import { convert } from '@piying/view-angular-core';
@Injectable()
class TestFormBuilder extends FormBuilder<any> {}
class NoViewSchemaHandle extends CoreSchemaHandle<any, any> {
  override end() {
    this.type = 'mock';
    this.wrappers = [];
    this.hooks = undefined;
  }
}
export function createNoViewPiying(
  obj: SchemaOrPipe,
  injector: Injector,
  options?: {
    context?: any;
    handle?: any;
    environments?: string[];
    types?: string[] | Record<string, any>;
    wrappers?: string[] | Record<string, any>;
    builder?: any;
  },
) {
  const MockType = { type: Symbol() } as any;
  const result = convert(obj, {
    injector: injector as any,
    builder: options?.builder ?? TestFormBuilder,
    context: options?.context,
    handle: options?.handle ?? NoViewSchemaHandle,
    environments: options?.environments,
    fieldGlobalConfig: {
      types: {
        mock: MockType as any,
      },
      wrappers: {},
    },
  });
  return result as _PiResolvedCommonViewFieldConfig;
}
