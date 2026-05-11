import * as vscode from 'vscode';
import * as v from 'valibot';
import { deepEqual } from 'fast-equals';
import { getDefaults } from '@piying/valibot-visit';
import { Signal, signal, WritableSignal } from 'static-injector';
import { deepClone } from '@cyia/util';
import { set } from 'lodash-es';
type ConfigSignal<T> = WritableSignal<NonNullable<T>>;

export type ResolveConfig<T extends Record<string, any>> = {
  [P in keyof T]-?: NonNullable<T[P]> extends object
    ? ResolveConfig<T[P]> & ConfigSignal<T[P]>
    : ConfigSignal<T[P]>;
};
function coreSchema(schema: { wrapped?: any }) {
  while ('wrapped' in schema) {
    schema = schema.wrapped;
  }
  return schema;
}
function findIntersectItem(
  schema: v.IntersectSchema<[v.ObjectSchema<any, any>], any>,
  key: string,
) {
  for (const item of schema.options) {
    if (v.isOfType('object', item)) {
      if (key in item.entries) {
        return item.entries[key];
      }
    } else {
      return findIntersectItem(item as any, key);
    }
  }
}
function createListenSignal(
  CONFIG: any,
  vsConfig: vscode.WorkspaceConfiguration,
  prefix: string,
) {
  const list: ((e: vscode.ConfigurationChangeEvent) => any)[] = [];
  const map = new Map<string, Signal<any>>();
  vscode.workspace.onDidChangeConfiguration((e) => {
    list.forEach((fn) => fn(e));
  });
  return <T = any>(parentKey: string[]) => {
    const id = parentKey.join('.');
    if (map.has(id)) {
      return map.get(id)! as Signal<T>;
    }

    const l = parentKey.slice();
    let c = CONFIG as any;
    while (l.length) {
      const item = l.shift()!;
      const wrapped = coreSchema(c) as any;
      if (v.isOfType('object', wrapped)) {
        c = (wrapped as v.ObjectSchema<any, any>).entries[item];
      } else if (v.isOfType('intersect', wrapped as any)) {
        c = findIntersectItem(wrapped as any, item);
      } else {
        throw '配置未实现';
      }
    }
    function getValue() {
      const result = vsConfig.inspect(parentKey.join('.'));
      // fixme 因为保存后没法直接读到,但是能通过这种方法读到,所以临时这么改,linux下好像正常
      const value =
        result?.workspaceValue ??
        result?.workspaceFolderValue ??
        result?.globalValue ??
        result?.defaultValue;
      const result2 = v.safeParse(c, value ?? getDefaults(c as any));
      if (!result2.success) {
        console.log('配置读取异常!!!!!', result2.issues);
        const messageList = result2.issues.map((item) => {
          return `读取配置[${[...parentKey, ...item.path.map((item: any) => item.key)].join('.')}]异常\n${item.message ?? ''}`;
        });
        vscode.window.showWarningMessage(messageList.join('\n'));
        throw new Error(JSON.stringify(result2.issues));
      }
      return result2.output;
    }

    const value$ = signal<T>(getValue(), {
      equal: deepEqual,
    });
    map.set(id, value$);

    list.push((e) => {
      if (e.affectsConfiguration(`${prefix}.${parentKey[0]}`)) {
        value$.set(getValue());
      }
    });
    return value$;
  };
}

export function createProxy(
  listenSignal: ReturnType<typeof createListenSignal>,
  vsConfig: vscode.WorkspaceConfiguration,
  parentKey: string[],
  fn?: any,
): any {
  const list = parentKey;
  return new Proxy(fn || {}, {
    get(target, p: string, receiver) {
      // 用于设置,这两个键不可被设置
      if (p === 'set' || p === 'update') {
        return target[p];
      }
      const parentKey = list.slice();
      parentKey.push(p);

      const fn = (): any => {
        return listenSignal(parentKey)();
      };
      (fn as any)['set'] = (value: any) => {
        if (deepEqual(fn(), value)) {
          return;
        }
        if (parentKey.length === 1) {
          return vsConfig.update(parentKey.join('.'), value);
        } else {
          const rootKey = parentKey[0];
          const rootValue = deepClone(listenSignal([rootKey])());
          set(rootValue, parentKey.slice(1), value);
          return vsConfig.update(rootKey, rootValue);
        }
      };
      (fn as any)['update'] = (updateFn: (value: any) => any) => {
        return (fn as any)['set'](updateFn(fn()));
      };

      return createProxy(listenSignal, vsConfig, parentKey, fn);
    },
  });
}
export function createConfig<T extends v.BaseSchema<any, any, any>>(
  define: T,
  prefix: string,
) {
  const vsConfig = vscode.workspace.getConfiguration(prefix);
  const listenSignal = createListenSignal(define, vsConfig, prefix);
  return createProxy(listenSignal, vsConfig, []) as ResolveConfig<
    v.InferOutput<T>
  >;
}
