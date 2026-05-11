import { getImgSrcFactory } from '@bridge/share';

export const getImgSrc = getImgSrcFactory(window.__pageConfig.data.filePath!);
