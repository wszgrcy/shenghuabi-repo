import { NodeRunnerBase } from '@shenghuabi/workflow';
import { configContentParse } from '../../../../../webview/config/parser';

export class SerializeRunner extends NodeRunnerBase {
  override async run() {
    const input = this.inputParams.get(this.node.inputs[0].value!)!;
    return async () => {
      return {
        value: await configContentParse(
          input.value,
          typeof input.extra?.filePath === 'string'
            ? input.extra.filePath
            : undefined,
        ),
        extra: input.extra,
      };
    };
  }
}
