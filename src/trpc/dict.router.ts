import * as v from 'valibot';
import { t } from './t';

export const ConfigRouter = t.router({
  findAll: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    return 'hello world';
  }),
});
