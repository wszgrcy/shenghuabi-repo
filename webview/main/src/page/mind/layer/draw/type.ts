import type { Excalidraw } from '@excalidraw/excalidraw';
import {
  ExcalidrawElement,
  ExcalidrawFrameLikeElement,
  NonDeleted,
} from '@excalidraw/excalidraw/element/types';
import { AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
type ExportOpts = {
  elements: readonly NonDeleted<ExcalidrawElement>[];
  appState?: Partial<Omit<AppState, 'offsetTop' | 'offsetLeft'>>;
  files: BinaryFiles | null;
  maxWidthOrHeight?: number;
  exportingFrame?: ExcalidrawFrameLikeElement | null;
};
type InputType = typeof Excalidraw;
export type ExcalidrawProps = Parameters<InputType>[0];
export type ExcalidrawImperativeAPI = Parameters<
  NonNullable<ExcalidrawProps['excalidrawAPI']>
>[0];
export type ExportToSvgInput = ExportOpts;
