import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Directive({
  selector: '[openDialog]',
  standalone: true,
})
export class OpenDialogDirective {
  @Input() openDialog: any;
  @Input() data: any;
  @Input() config?: MatDialogConfig<any>;
  @Output() afterClose = new EventEmitter();
  service = inject(MatDialog);
  @HostListener('click')
  click() {
    const ref = this.service.open(this.openDialog, {
      ...this.config,
      data: this.data,
    });
    ref.afterClosed().subscribe((value) => {
      this.afterClose.emit(value);
    });
  }
}
