import { rawConfig } from '@piying/view-angular';
import { FormDefineOption } from '@share/valibot/type';

export function formDefine<TInput>(input: FormDefineOption) {
  //   let data = omitBy(input, (value) => value === undefined);
  return rawConfig<TInput>((field) => {
    field.formConfig = {
      ...field.formConfig,
      ...input,
    };

    return field;
  });
}
