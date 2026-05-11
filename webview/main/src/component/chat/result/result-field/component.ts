import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  model,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MarkdownPipe } from '../../../../pipe/markdown.pipe';
import { SpanInputFCC } from '@cyia/component/core';
import { isMarkdown } from '@fe/util/is-markdown';

@Component({
  selector: 'result-field',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    SpanInputFCC,
    FormsModule,
    MarkdownPipe,
    MatMenuModule,
    MatIconModule,
    ClipboardModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../result-field/component.scss'],
})
export class ResultFieldComponent {
  readonly = input<boolean>(false);
  value = model.required<string>();
  thinkContent = input<string>();
  type = model<'markdown' | 'plaintext'>('plaintext');
  reChat = input<() => any>();
  enableMenu = input<boolean>(true);
  toggle() {
    this.type.update((data) => {
      return data === 'markdown' ? 'plaintext' : 'markdown';
    });
  }
  #injector = inject(Injector);

  ngOnInit(): void {
    const ref = effect(
      () => {
        const value = this.value();
        untracked(() => {
          if (isMarkdown(value)) {
            this.type.set('markdown');
            ref.destroy();
          } else {
            this.type.set('plaintext');
          }
        });
      },
      { injector: this.#injector },
    );
  }
}
