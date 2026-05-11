import { SerializedListItemNode, SerializedListNode } from '@lexical/list';
import {
  SerializedLexicalNode,
  SerializedParagraphNode,
  SerializedTextNode,
} from 'lexical';

export function createLexicalParagraphSerialNode(
  children?: SerializedLexicalNode[],
): SerializedParagraphNode {
  return {
    children: children ?? [],
    direction: null,
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    type: 'paragraph',
    version: 1,
  };
}
export function createLexicalText(content: string): SerializedTextNode {
  return {
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text: content,
    type: 'text',
    version: 1,
  };
}
export function createLexicalUlSerialNode(
  children?: SerializedListItemNode[],
): SerializedListNode {
  return {
    tag: 'ul',
    listType: 'bullet',
    start: 1,
    format: '',
    indent: 0,
    children: children ?? [],
    type: 'list',
    version: 1,
    direction: null,
  };
}
export function createLexicalLiSerialNode(
  children?: SerializedLexicalNode[],
): SerializedListItemNode {
  return {
    children: children ?? [],
    version: 1,
    indent: 0,
    format: '',
    type: 'listitem',
    direction: null,
    checked: undefined,
    value: undefined as any,
  };
}
