import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ValueFormatDirective } from '../../directive/value-format.directive';
import { JsonPipe } from '@angular/common';
import { CdkCopyToClipboard } from '@angular/cdk/clipboard';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    ValueFormatDirective,
    MatDialogModule,
    JsonPipe,
    CdkCopyToClipboard,
  ],
  styleUrl: './component.scss',
})
export class JSONFormatComponent {
  props = inject(MAT_DIALOG_DATA);
}
