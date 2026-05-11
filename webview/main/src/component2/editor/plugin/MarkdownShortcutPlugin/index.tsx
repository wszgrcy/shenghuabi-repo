/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import * as React from 'react';

import { Injector } from '@angular/core';
import type { JSX } from 'react';
import { MarkdownService } from '../../markdown.service';

export default React.memo(function MarkdownPlugin(options: {
  injector: Injector;
}): JSX.Element {
  return (
    <MarkdownShortcutPlugin
      transformers={options.injector.get(MarkdownService).getTransformers()}
    />
  );
});
