import { PiViewConfig } from '@piying/view-angular';
import { DefaultFormTypes, Wrappers } from '@fe/form/default-type-config';

export const FieldGlobalConfig = {
  types: DefaultFormTypes,
  wrappers: {
    ...Wrappers,
  },
} as PiViewConfig;
