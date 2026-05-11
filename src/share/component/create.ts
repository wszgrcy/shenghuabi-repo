import * as v from 'valibot';
export function createInput<
  const Input extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
>(input: Input) {
  return v.union([
    input,
    v.pipe(
      v.function(),
      // todo 上下文
      v.args(v.tuple([v.custom<any>(Boolean)])),
      v.returns(input),
    ),
  ]);
}

export function createDefine<
  const Type extends string,
  const Inputs extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>,
  const Wrappers extends readonly string[],
>(type: Type, inputs: Inputs, wrappers: Wrappers) {
  return v.object({
    type: v.literal(type),
    inputs: v.optional(createInput(inputs)),
    wrappers: v.optional(v.array(v.picklist(wrappers))),
  });
}
