import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister, objectKlassEquals } from '@lexical/utils';
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import {
  $toggleLink,
  CustomLinkNode,
  TOGGLE_CUSTOM_LINK_COMMAND,
} from '../linkNode';
import { CardEditorService } from '../../../card-editor.service';
import { Injector } from '@angular/core';

type Props = {
  validateUrl?: (url: string) => boolean;
  injector: Injector;
};

export function CustomLinkPlugin({ validateUrl, injector }: Props): null {
  const service = injector.get(CardEditorService);
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([CustomLinkNode])) {
      throw new Error('LinkPlugin: LinkNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand(
        TOGGLE_CUSTOM_LINK_COMMAND,
        (payload) => {
          $toggleLink(payload, injector, editor);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),

      validateUrl !== undefined
        ? editor.registerCommand(
            PASTE_COMMAND,
            (event) => {
              const selection = $getSelection();
              if (
                !$isRangeSelection(selection) ||
                selection.isCollapsed() ||
                !objectKlassEquals(event, ClipboardEvent)
              ) {
                return false;
              }
              const clipboardEvent = event as ClipboardEvent;
              if (clipboardEvent.clipboardData === null) {
                return false;
              }
              const clipboardText =
                clipboardEvent.clipboardData.getData('text');
              if (!validateUrl(clipboardText)) {
                return false;
              }
              // If we select nodes that are elements then avoid applying the link.
              if (!selection.getNodes().some((node) => $isElementNode(node))) {
                // todo !粘贴时还需要调校
                editor.dispatchCommand(TOGGLE_CUSTOM_LINK_COMMAND, {
                  method: 'create',
                });
                event.preventDefault();
                return true;
              }
              return false;
            },
            COMMAND_PRIORITY_LOW,
          )
        : () => {
            // Don't paste arbritrary text as a link when there's no validate function
          },
    );
  }, [editor, validateUrl]);

  return null;
}
