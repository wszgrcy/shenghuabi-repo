import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TrpcService } from '@fe/trpc';
import { ProgressComponent } from '../../page/environment-configuration/progress/component';
import {
  StartDownloadMessage,
  EndDownloadMessage,
  ErrorDownloadMessage,
} from '../../page/environment-configuration/const';
import { MatIcon, MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'download-button',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatProgressSpinnerModule,
    MatProgressBarModule,
    ProgressComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadButtonFCC {
  label = input('下载');
  fileList = input<
    { url: string; dir?: string | undefined; fileName?: string | undefined }[]
  >([]);
  dir = input<string>();
  autoUnzip = input(true);
  strip = input(0);
  loading$ = signal(false);
  #client = inject(TrpcService).client;
  info = signal<any>(undefined);
  download() {
    this.loading$.set(true);
    return new Promise<void>((resolve, reject) => {
      this.info.set(StartDownloadMessage);
      this.#client.fs.download.subscribe(
        {
          fileList: this.fileList()!,
          dir: this.dir()!,
          autoUnzip: this.autoUnzip(),
          strip: this.strip(),
        },
        {
          onData: (value) => {
            this.info.set(value);
          },
          onComplete: () => {
            this.info.set(EndDownloadMessage);
            resolve();
          },
          onError: (err) => {
            this.info.set(ErrorDownloadMessage);
            reject(err);
          },
        },
      );
    }).finally(() => {
      this.loading$.set(false);
    });
  }
  openDir() {
    this.#client.fs.openWorkspaceFolder.query(this.dir()!);
  }
}
