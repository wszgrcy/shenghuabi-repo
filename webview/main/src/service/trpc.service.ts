import { Injectable } from '@angular/core';
import { createTRPCProxyClient } from '@trpc/client';
import { ipcLink } from '@cyia/vscode-trpc/client';
import type { AppRouter } from '@bridge/api';
@Injectable({
  providedIn: 'root',
})
export class TrpcService {
  client = createTRPCProxyClient<AppRouter>({
    links: [ipcLink()],
  });
  readonly #callbacks = new Map<number, (response: any) => void>();
  #requestId = 1;
  request(type: string, body?: any) {
    const requestId = this.#requestId++;
    const p = new Promise<any>((resolve) =>
      this.#callbacks.set(requestId, resolve),
    );
    vscode.postMessage({ type: type, requestId, body });
    return p;
  }
  // todo listen合并
  listen(type: string, fn: (body: any) => any) {
    window.addEventListener('message', async ({ data }) => {
      if (data.type === type) {
        const result = await fn(data.body);
        if (result === undefined) {
          return;
        }
        vscode.postMessage({
          type,
          body: result,
          requestId: data.requestId,
        });
      }
    });
  }
  constructor() {
    window.addEventListener('message', (e) => {
      if (this.#callbacks.has(e.data?.requestId)) {
        this.#callbacks.get(e.data?.requestId)?.(e.data.body);
        this.#callbacks.delete(e.data?.requestId);
      }
    });
  }
}
