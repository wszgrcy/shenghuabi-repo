import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TrpcService } from '@fe/trpc';

@Component({
  selector: 'install-check',
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
})
export class InstallCheckComponent {
  #client = inject(TrpcService).client;

  text$ = signal('检查更新');
  loading$ = signal(true);
  ngOnInit(): void {
    this.#client.request.version.query(undefined).then((a) => {
      if (a.needUpdate) {
        this.loading$.set(false);
        this.text$.set(`${a.version}下载`);
      } else {
        this.text$.set(`无需升级`);
      }
    });
  }
  async download() {
    this.text$.set(`下载中`);
    this.loading$.set(true);
    await this.#client.request.download.query(undefined);
    this.text$.set(`下载完成`);
  }
}
