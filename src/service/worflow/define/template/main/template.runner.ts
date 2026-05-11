import { NodeRunnerBase } from '@shenghuabi/workflow';
import { Liquid } from 'liquidjs';
import { TEMPLATE_NODE_DEFINE } from '../template.node.define';

const engine = new Liquid({ jsTruthy: true });

export class TemplateRunner extends NodeRunnerBase {
  override async run() {
    const nodeResult = this.getParsedNode(TEMPLATE_NODE_DEFINE);

    const contextObj = this.inputValueObject$$();
    const { type, define } = nodeResult.data.config;
    if (type === 'card') {
      return async () => {
        return {
          value: await Promise.all(
            Object.entries(define).map(async ([key, value]) => {
              return engine
                .render(engine.parse(value), contextObj)
                .then((value) => {
                  return [key, value] as const;
                });
            }),
          ).then((list) => {
            return list.reduce(
              (obj, [key, value]) => {
                obj[key] = value;
                return obj;
              },
              {} as Record<string, any>,
            );
          }),
        };
      };
    } else if (type === 'text') {
      delete (define as any)['title'];
      return async () => {
        return {
          value: await Promise.all(
            Object.entries(define).map(async ([key, value]) => {
              return engine
                .render(engine.parse(value), contextObj)
                .then((value) => {
                  return [key, value] as const;
                });
            }),
          ).then((list) => {
            return list.reduce(
              (obj, [key, value]) => {
                obj[key] = value;
                return obj;
              },
              {} as Record<string, any>,
            );
          }),
        };
      };
    } else {
      throw new Error(`未实现${type}`);
    }
  }
}
