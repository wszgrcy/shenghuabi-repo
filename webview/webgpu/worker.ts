import { NodeProxy } from './common/custom-cache';
import { Text2VecService } from './common/text2vec';
let index = 0;
const responseMap = new Map<number, (arg: any) => void>();
function call(method: string, parameters: any[]) {
  const id = index++;
  const { promise, resolve } = Promise.withResolvers();
  responseMap.set(id, resolve);
  postMessage({ method, parameters, id });
  return promise;
}
const cacheProxy: NodeProxy = {
  match: (request: string) => {
    return call('cache:match', [request]) as Promise<ArrayBuffer | undefined>;
  },
  put: (request: string, arraybuffer: ArrayBuffer) => {
    return call('cache:put', [request, arraybuffer]) as Promise<void>;
  },
};
let instance: Text2VecService;
function createText2Vec() {
  instance = new Text2VecService({ cache: cacheProxy });
}
addEventListener('message', async (ev) => {
  let { method, parameters, id, response, value } = ev.data;
  let result;
  if (!response) {
    switch (method) {
      case 'create':
        result = createText2Vec();
        break;
      case 'init':
        result = await instance.init(parameters[0]);
        break;
      case 'extractor': {
        result = await instance.extractor(parameters[0]);
        break;
      }
      case 'getSize': {
        result = await instance.getSize();
        break;
      }
    }
    postMessage({ id, response: true, value: result });
  } else {
    responseMap.get(id)!(value);
  }
});
