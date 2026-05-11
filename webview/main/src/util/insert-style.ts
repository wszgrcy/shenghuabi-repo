import { computed } from '@angular/core';
import { StyleSheet } from '@emotion/sheet';
import murmur2 from '@emotion/hash';

const sheet = computed(() => {
  return new StyleSheet({
    key: 'theme',
    container: document.head,
    speedy: true,
  });
});

const hashSet = new Set<string>();
export function insertSheet(
  style: string,
  options?: {
    prefix?: string;
    selectorCreate?: (selector: string) => string;
  },
) {
  const hash = murmur2(style);

  const selector = options?.prefix ? `${options.prefix}-${hash}` : hash;
  if (hashSet.has(selector)) {
    return selector;
  }
  sheet().insert(
    `${options?.selectorCreate?.(selector) ?? '.' + selector}{${style}}`,
  );
  hashSet.add(selector);
  return selector;
}
export function insertScopeSheet(style: string) {
  return insertSheet(style, {
    prefix: 'theme',
    selectorCreate: (a) => `@scope(.${a})`,
  });
}
