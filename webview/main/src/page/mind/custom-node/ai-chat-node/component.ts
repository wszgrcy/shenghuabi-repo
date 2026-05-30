import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ChatComponent } from '@fe/component/chat/component';
import { BridgeService } from '../../service';
import { deepEqual } from 'fast-equals';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { getConnectedEdges, getOutgoers } from '@xyflow/react';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrpcService } from '@fe/trpc';
import { deepClone } from '../../../../util/clone';
import { effectOnce } from '../../../../util/effect-once';
import { MenuGroupComponent } from '@fe/component/menu-group/component';
import { ChatService } from '@fe/component/chat/chat.service';
import { NodeBase } from '../node.base';
import { ChatDataType, flatFilterHandleList } from '@bridge/share';

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
