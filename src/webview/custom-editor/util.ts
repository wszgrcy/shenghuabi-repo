// todo 第一次应该常量复制
export function createNewWorkflow() {
  return { flow: { nodes: [], edges: [] } };
}
export class TimeInvalid {
  invalid = true;
  constructor(timeout: number) {
    setTimeout(() => {
      this.invalid = false;
    }, timeout);
  }
}
