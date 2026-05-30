import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [],
  providers: [],
  selector: `ai-chat-node`,
  styleUrl: './component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatNode {}
