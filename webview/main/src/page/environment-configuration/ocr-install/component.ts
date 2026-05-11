import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TrpcService } from '@fe/trpc';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { InstallMessage } from '../../../../../../src/service/external-call/type';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { Unsubscribable } from '@trpc/server/observable';

@Component({
  selector: `ocr-install`,
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    NgTemplateOutlet,
    MatProgressBarModule,
    PurePipe,
    MatSelectModule,
    MatTooltipModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatStepperModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OCRInstallConfigurationComponent implements OnInit {
  #client = inject(TrpcService).client;
  #fb = inject(FormBuilder);
  group = this.#fb.nonNullable.group({
    ocr: this.#fb.nonNullable.group({
      dir: '',
    }),
  });
  next = output();

  ocrStatus$ = signal<{ installStatus: string } | undefined>(undefined);

  chatResult$ = signal('');

  constructor() {
    this.group.valueChanges.subscribe((a) => {
      this.#client.environment.ocr.saveConfig.query(a as any);
    });
  }
  #checkUpdate() {}
  ngOnInit(): void {
    this.#checkUpdate();
    this.#client.environment.ocr.getConfig.query(undefined).then((data) => {
      this.group.setValue(data);
    });
    this.#client.environment.ocr.status.subscribe(undefined, {
      onData: (result) => {
        this.ocrStatus$.set(result);
      },
    });
  }
  changePath(type: 'ocr') {
    this.#client.fs.selectFolder
      .query(this.group.controls[type].controls.dir.value || '')
      .then((value) => {
        if (!value) {
          return;
        }
        this.group.controls[type].controls.dir.setValue(value);
      });
  }
  ocrDownloadStatus$ = signal<InstallMessage | undefined>(undefined);
  $ocrU?: Unsubscribable;
  downloadModel() {
    this.$ocrU?.unsubscribe();
    this.$ocrU = this.#client.environment.ocr.download.subscribe(
      this.group.controls['ocr'].controls.dir.value!,
      {
        onData: (value) => {
          this.ocrDownloadStatus$.set(value);
        },
        onComplete: () => {
          this.ocrDownloadStatus$.set({ type: 'end', value: 100 });
        },
      },
    );
  }

  progressColor(event: { type: string; value: number }) {
    if (event.type === 'end') {
      return 'primary';
    } else if (event.type === 'data' || event.type === 'start') {
      return 'accent';
    } else {
      return 'warn';
    }
  }
  openFolder(file: string) {
    this.#client.fs.openFolder.query(file);
  }

  showChannel(str: string) {
    if (!str) {
      return;
    }
    this.#client.environment.showChannel.query(str);
  }
}
