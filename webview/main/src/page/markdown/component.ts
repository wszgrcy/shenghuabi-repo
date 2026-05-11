import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ExternalDocumentService } from '@fe/component/external-document';
import { TrpcService } from '@fe/trpc';
import { parse, use } from 'marked';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule],
  providers: [ExternalDocumentService],
  styleUrls: ['./component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MarkdownComponent implements OnInit {
  #client = inject(TrpcService).client;
  #domSanitizer = inject(DomSanitizer);
  data = signal<SafeHtml | undefined>(undefined);
  #inputData = window.__pageConfig.data;
  extComp = inject(ExternalDocumentService);
  constructor() {
    this.extComp.init();
  }

  ngOnInit(): void {
    use({
      renderer: {
        image: ({
          href,
          text,
        }: {
          href: string;
          text: string;
          title: string;
        }) => {
          const [width, height] = text?.startsWith('=')
            ? text
                .slice(1)
                .split('x')
                .map((v) => v.trim())
                .filter(Boolean)
            : [];
          return `<img src="${href}" alt="${text}"${
            width
              ? ` width="${width}"${height ? ` height="${height}"` : ''}`
              : ''
          }>`;
        },
      } as any,
    });
    this.#client.fs.readFileContent
      .query(this.#inputData.filePath!)
      .then(async (result) => {
        this.data.set(
          this.#domSanitizer.bypassSecurityTrustHtml(
            await parse(result, { gfm: true }),
          ),
        );
      });
  }
}
