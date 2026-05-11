import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonChat } from '@bridge/share';
import { AssistantChatMessageType } from '@shenghuabi/openai/define';
import { MatDividerModule } from '@angular/material/divider';
import { CdkCopyToClipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { ResultFieldComponent } from '../result-field/component';
import { GetChatItemContentPipe } from '../../../../pipe/get-chat-item-content.pipe';
import { CommonChatFn } from '../../type';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule,
    ClipboardModule,

    PurePipe,
    CdkCopyToClipboard,
    ResultFieldComponent,
    GetChatItemContentPipe,
  ],
  selector: `common-chat-result`,
})
export class CommonChatResultComponent {
  result = input.required<CommonChat>();
  index = input.required<number>();
  commonChat = input.required<CommonChatFn>();
  constructor() {}
  refresh = () => {
    const data = this.result();
    this.commonChat()(data.input, data.historyList!.slice(0, -2), this.index());
  };

  resultContent = (data: AssistantChatMessageType) => {
    return data.content[0].text;
  };
  resultThinkContent = (data: AssistantChatMessageType) => {
    return data.thinkContent;
  };
}
