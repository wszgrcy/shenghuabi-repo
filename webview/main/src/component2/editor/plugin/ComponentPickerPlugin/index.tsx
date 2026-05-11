/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode } from 'lexical';
import { useCallback, useMemo, useState } from 'react';
import type { JSX } from 'react';

import * as ReactDOM from 'react-dom';
import { CreateNodeMenuComponent } from './create-node-menu/component';
import { Injector } from '@angular/core';
import { CardEditorService, NODE_ITEM } from '../../card-editor.service';
import { NgOutletReact } from '@cyia/component/bridge';

export default function ComponentPickerMenuPlugin({
  injector,
}: {
  injector: Injector;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });
  const options = useMemo(() => {
    const service = injector.get(CardEditorService);
    const baseOptions = service.triggerList$();

    if (!queryString) {
      return baseOptions;
    }

    const regex = new RegExp(queryString, 'i');
    // 可以加拼音
    return [
      ...baseOptions.filter(
        (option) =>
          regex.test(option.label) ||
          option.keywords.some((keyword) => regex.test(keyword)),
      ),
    ];
  }, [editor, queryString]);

  const onSelectOption = useCallback(
    (
      selectedOption: NODE_ITEM,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string,
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
        selectedOption.click(editor);
        closeMenu();
      });
    },
    [editor],
  );

  return (
    <>
      <LexicalTypeaheadMenuPlugin<any>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
        options={options}
        menuRenderFn={(
          anchorElementRef,
          { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
        ) =>
          anchorElementRef.current && options.length
            ? ReactDOM.createPortal(
                <NgOutletReact
                  component={CreateNodeMenuComponent}
                  props={{ options, selectOptionAndCleanUp }}
                ></NgOutletReact>,
                anchorElementRef.current,
              )
            : null
        }
      />
    </>
  );
}
