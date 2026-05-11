import { InjectionToken } from '@angular/core';
import { createCommand } from 'lexical';

export const inputToken = new InjectionToken('inputData');

export const INSERT_NEW_LINE = createCommand();
export const DISABLE_TOOLKIT = createCommand();
