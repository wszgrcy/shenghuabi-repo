import { OverlayRef } from '@angular/cdk/overlay';
import { ComponentRef, Injector } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import * as v from 'valibot';
export interface TextEditorUtil {
  openPortal(
    schema: v.BaseSchema<any, any, any>,
    value: Record<string, any>,
    context: Record<string, any>,
    overflowRef: OverlayRef,
    injector: Injector,
  ): Promise<ComponentRef<any>>;
  openDialog(
    schema: v.BaseSchema<any, any, any>,
    value: Record<string, any>,
    context: Record<string, any>,
    title: string,
    injector: Injector,
    options?: { beforeClose: (model: any) => Promise<any> },
  ): Promise<MatDialogRef<any, any>>;
  saveFile(input: { filePath: string }): Promise<string>;
}
// export const TextEditorImplToken=new InjectionToken()
