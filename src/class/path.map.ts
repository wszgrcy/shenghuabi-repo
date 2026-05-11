import { path } from '@cyia/vfs2';

export class PathMap<Value = any> extends Map<string, Value> {
  override get(key: string): Value | undefined {
    return super.get(path.normalize(key));
  }
  override set(key: string, value: Value): this {
    return super.set(path.normalize(key), value);
  }
  override delete(key: string): boolean {
    return super.delete(path.normalize(key));
  }
  override has(key: string): boolean {
    return super.has(path.normalize(key));
  }
}
export class TempPathMap<Value = any> extends PathMap<Value> {
  override get(key: string): Value | undefined {
    const fp = path.normalize(key);
    const result = super.get(fp);
    this.delete(fp);
    return result;
  }
}
