import { createCommand, LexicalCommand } from 'lexical';
import { DeleteImagePayload } from './editor/nodes/image/ImageNode';

export const ASSET_DELETE_COMMAND: LexicalCommand<DeleteImagePayload> =
  createCommand('ASSET_DELETE_COMMAND');
