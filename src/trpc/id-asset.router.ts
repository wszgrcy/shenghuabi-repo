import * as v from 'valibot';
import { t } from './t';
import { IdAssetReferenceWebview } from '../webview/custom-webview/id-asset-reference';

export const IdAssetRouter = t.router({
  get: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
    const assetMap = ctx.injector.get(IdAssetReferenceWebview).assetMap;
    const data = assetMap.get(input);
    assetMap.delete(input);
    return data;
  }),
});
