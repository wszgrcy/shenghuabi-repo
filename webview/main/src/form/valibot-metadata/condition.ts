import { condition as inlineCondition } from '@piying/view-angular';
import { ConditionOption } from '@share/valibot/type';
// 仅用于导出使用
export function condition<TInput>(input: ConditionOption<TInput>) {
  return inlineCondition<TInput>(input as any);
}
