import {
  ChangeDetectionStrategy,
  Component,
  Input,
  booleanAttribute,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrpcService } from '@fe/trpc';

@Component({
  selector: 'command-button',
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
})
export class CommandButtonComponent {
  #client = inject(TrpcService).client;
  @Input({ required: true }) command!: string;
  @Input({ required: false }) check!: string;
  @Input({
    required: true,
    transform: booleanAttribute,
  })
  prefix!: boolean;

  @Input({
    required: false,
    transform: (value: any) => {
      if (!value) {
        return undefined;
      }
      if (typeof value === 'object') {
        return value;
      }
      return JSON.parse(value);
    },
  })
  options: any;
  loading$ = signal(false);
  needCheck$ = signal(false);
  hint() {
    this.loading$.set(true);
    this.#client.command.exec
      .query({
        command: (this.prefix ? 'shenghuabi.' : '') + this.command,
        options: [this.options],
      })
      .then((a) => {
        this.loading$.set(false);
      });
  }
  checkStatus$ = signal(false);
  ngOnInit(): void {
    if (this.check) {
      this.needCheck$.set(true);
      this.#client.command.check.query(this.check).then((value) => {
        this.checkStatus$.set(value);
      });
    }
  }
}
