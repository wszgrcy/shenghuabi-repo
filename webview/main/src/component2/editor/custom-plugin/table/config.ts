import { asColumn } from '@cyia/component/valibot-util';
import * as v from 'valibot';

export const INSERT_FORM_CONFIG = v.pipe(
  v.object({
    rows: v.pipe(v.optional(v.number(), 5), v.title('行数'), v.maxValue(500)),
    columns: v.pipe(v.optional(v.number(), 5), v.title('列数'), v.maxValue(50)),
  }),
  asColumn(),
);
