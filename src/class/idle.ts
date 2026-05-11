export class IdleClean {
  #timeout;
  #fn;
  #timeoutId: any;
  constructor(cleanFn: () => void, timeout: number) {
    this.#timeout = timeout;
    this.#fn = cleanFn;
    this.restart();
  }
  stop() {
    clearTimeout(this.#timeoutId);
  }
  restart() {
    this.stop();
    this.#timeoutId = setTimeout(() => {
      this.#fn();
    }, this.#timeout);
  }
}
