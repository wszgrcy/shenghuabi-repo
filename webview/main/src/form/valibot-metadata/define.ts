import { rawConfig } from '@piying/view-angular';
import { isUndefined, omitBy } from 'lodash-es';
import { DefineOption } from '../../../../../src/share/workflow/node-define/valibot-metadata/type';

export function define<TInput>(input: DefineOption) {
  //   let data = omitBy(input, (value) => value === undefined);
  return rawConfig<TInput>((field, context) => {
    // const directives: NgSchemaHandle['directives'] = [];

    field.renderConfig ??= {
      ...(field.renderConfig || {}),
      ...omitBy(
        {
          hidden: input.hidden,
        },
        isUndefined,
      ),
    };
    field.inputs ??=
      typeof input.inputs === 'function' ? input.inputs(context) : input.inputs;

    // field.directives = directives;
    field.wrappers =
      input.wrappers?.map((item) => {
        return {
          type: item,
          inputs: {},
          outputs: {},
          attributes: {},
          events: {},
          slots: {},
        };
      }) ?? [];

    if ('type' in input) {
      field.type = input.type;
    }
    if ('alias' in input) {
      field.alias = input.alias;
    }
    return field;
  });
}
