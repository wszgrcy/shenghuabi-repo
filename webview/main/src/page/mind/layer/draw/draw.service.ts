import { Injectable, signal } from '@angular/core';
import { ExcalidrawImperativeAPI } from './type';

@Injectable()
export class DrawService {
  instance = signal<ExcalidrawImperativeAPI | undefined>(undefined);
}
