import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrpcService } from '@fe/trpc';
import { MatDividerModule } from '@angular/material/divider';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { ValueFormatDirective } from '../../../../directive/value-format.directive';
import { metadataFormat, metadataTooltipFormat } from '../../helper';
import { ResultFieldComponent } from '../result-field/component';
import { ShMarkdownTooltipDirective } from '../../../../directive/markdown-tooltip.directive';
import { isChatStream, WorkflowStreamData } from '@bridge/share';
import { AsyncPipe } from '@angular/common';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    FormsModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    ClipboardModule,
    PurePipe,
    ValueFormatDirective,
    ResultFieldComponent,
    ShMarkdownTooltipDirective,
    AsyncPipe,
  ],
  selector: `workspace-chat-result`,
})
export class WorkflowChatResultComponent {
  result = model.required<WorkflowStreamData[]>();
  insertCodeAction = input(false);
  /** 好像没用 */
  context = input.required<any>();
  #client = inject(TrpcService).client;
  root = input(true);

  /** 到编辑器中 */
  async insertRight(index: number) {
    await this.#client.ai.applyCodeAction.query(this.result()[index]!.value);
  }

  metadataItem = metadataFormat;
  metadataTooltip = metadataTooltipFormat;
  isStringResult = (data: string) => {
    return typeof data === 'string';
  };
  isChatResult = (data: WorkflowStreamData) => {
    return isChatStream(data);
  };
  isAudioResult = (data: any) => {
    return 'extra' in data && data.extra.format === 'audio';
  };
  audioUrl = (filePath: string) => {
    return this.#client.environment.getAssetPath.query(filePath);
  };
}
