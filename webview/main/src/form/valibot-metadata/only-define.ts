import { rawConfig } from '@piying/view-angular';

export function onlyDefine<TInput>() {
  return rawConfig<TInput>((field, context) => {
    field.type = undefined;
    return field;
  });
}
