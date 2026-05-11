import { Signal } from '@angular/core';

export interface MenuCheckboxOption {
  color?: string;
  icon?: string;
  value: any;
  disabled?: Signal<boolean>;
  description?: string;
  beforeChange?: () => Promise<boolean>;
}
