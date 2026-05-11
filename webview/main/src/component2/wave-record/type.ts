import { WaveSurferOptions } from 'wavesurfer.js';

export type WaveSurferCommonOptions = Omit<WaveSurferOptions, 'container'>;
