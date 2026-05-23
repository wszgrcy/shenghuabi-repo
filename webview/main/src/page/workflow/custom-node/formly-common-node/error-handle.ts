import {
  ErrorSummary,
  getDeepError,
  ValidationDescendantError2,
} from '@piying/view-angular-core';

/**
 * 处理函数类型：接收一个 ErrorSummary，包含完整的错误信息和祖先路径
 */
export type ErrorSummaryHandler<T> = (summary: ErrorSummary) => T;

export function forEachErrorSummary<T>(
  summaryList: ErrorSummary[],
  handler: ErrorSummaryHandler<T>,
) {
  summaryList.forEach(forEachDeepError(handler));
}

function forEachDeepError<T>(handler: ErrorSummaryHandler<T>) {
  return (item: ErrorSummary) => {
    if (item.item.kind === 'descendant') {
      const error = item.item as ValidationDescendantError2;

      forEachErrorSummary(
        getDeepError({ errors: error.metadata } as any) ?? ([] as any),
        handler,
      );
    } else {
      handler(item);
    }
  };
}
