import { Component, OnInit, inject, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrpcService } from '@fe/trpc';
@Component({
  selector: 'install-dir',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatTooltipModule,
  ],
})
export class DirComponent implements OnInit {
  #client = inject(TrpcService).client;
  group = new FormGroup({
    dir: new FormControl(''),
  });
  valueChange = output<string>();
  next = output();

  constructor() {}

  ngOnInit(): void {
    this.#client.environment.getDefaultDir.query(undefined).then((value) => {
      this.group.controls.dir.reset(value, { emitEvent: false });
    });
    this.group.controls.dir.valueChanges.subscribe((value) => {
      this.#client.environment.saveDefaultDir.query(value!).then(() => {
        this.valueChange.emit(value!);
      });
    });
  }
  changePath(type: string) {
    this.#client.fs.selectFolder
      .query(this.group.controls.dir.value || '')
      .then((value) => {
        if (!value) {
          return;
        }
        this.group.controls.dir.setValue(value);
      });
  }
}
