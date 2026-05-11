import { rawConfig } from '@piying/view-angular';
import { SelectOption } from '../../../../../src/share/workflow/node-define/valibot-metadata/type';

export function selectOptions<TInput>(options?: readonly SelectOption[]) {
  return rawConfig<TInput>((field) => {
    field.props = {
      ...field.props,
      options,
    };
    return field;
  });
}
