import { contextBridge, ipcRenderer } from 'electron';

type CallBack = (input: any) => Promise<any>;
contextBridge.exposeInMainWorld('shenghuabi', {
  onPing: createListener('shb:ping'),
  onExtractor: createListener('shb:extractor'),
  onInit: createListener('shb:init'),
  onSize: createListener('shb:size'),
  cache: {
    match: (request: string) => {
      return ipcRenderer.invoke('shb:cache:match', request);
    },
    put: (request: string, arraybuffer: ArrayBuffer) => {
      return ipcRenderer.invoke('shb:cache:put', request, arraybuffer);
    },
  },
});

function createListener(channel: string) {
  return (callback: CallBack) => {
    ipcRenderer.on(channel, (_event, value: { data: any; id: number }) => {
      Promise.resolve(callback(value.data)).then((result) => {
        _event.sender.send('shb:response', {
          channel,
          id: value.id,
          data: result,
        });
      });
    });
  };
}
