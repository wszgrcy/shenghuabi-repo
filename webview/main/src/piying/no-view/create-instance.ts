import { Injector } from '@angular/core';
import { _PiResolvedCommonViewFieldConfig } from '@piying/view-angular-core';
import { convertToField } from '@piying/view-angular';
import * as v from 'valibot';

export function createNoViewPiying(
  obj: v.BaseSchema<any, any, any>,
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
  const result = convertToField(
    () => obj,
    injector,
    () => ({
      context: options?.context,
      environments: options?.environments,
    }),
  );
  return result as _PiResolvedCommonViewFieldConfig;
}
