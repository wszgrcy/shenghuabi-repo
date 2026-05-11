import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfigComponent } from './item/component';
import { TrpcService } from '@fe/trpc';
import { MatButtonModule } from '@angular/material/button';
import { LanguageList } from './const';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { LanguageMap } from '@shenghuabi/python-addon/define';
import { IndexTTSEmoConfigComponent } from './indextts-emo-item/component';
@Component({
  selector: 'app-player-list',
  templateUrl: './component.html',
  imports: [
    MatTableModule,
    MatTooltipModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatButtonModule,
    PurePipe,
    AsyncPipe,
    JsonPipe,
  ],
})
export class PlayerListComponent implements OnInit {
  dialog = inject(MatDialog);
  #client = inject(TrpcService).client;
  languageMap = LanguageMap as any;
  list = LanguageList;
  playerList$$ = computed(() => {
    return [...new Set(this.data$().map((item) => (item as any).player))];
  });
  config$ = signal<any>(undefined);
  data$ = computed(() => {
    return (this.config$()?.references || []) as any[];
  });
  indexTTSEmodata$ = computed(() => {
    return (this.config$()?.indexTTSEmoReferences || []) as any[];
  });
  laObj$$ = computed(() => {
    return this.config$()?.defaultLanguagePlayerReference ?? {};
  });
  psObj$$ = computed(() => {
    return this.config$()?.defaultPlayerStateReference ?? {};
  });
  constructor() {}
  audioUrl = (filePath: string) => {
    return this.#client.tts.getAudioAssetPath.query(filePath);
  };
  ngOnInit(): void {
    this.requestList();
  }
  requestList() {
    this.#client.environment.pythonAddon.getPlayerConfig
      .query(undefined)
      .then((value) => {
        this.config$.set(value);
      });
  }
  remove(data: any) {
    return this.#client.environment.pythonAddon.remove
      .query(data.id)
      .then(() => {
        this.requestList();
      });
  }
  save(data?: any) {
    const ref = this.dialog.open(ConfigComponent, {
      data: {
        data: data,
        save: (data: any) => {
          return this.#client.environment.pythonAddon.set.query(data);
        },
      },
    });
    ref.afterClosed().subscribe((a) => {
      if (a) {
        this.requestList();
      }
    });
  }
  setDefaultLanguage(language: string, player: string) {
    this.#client.environment.pythonAddon.setDefaultLanguage
      .query({
        language,
        player,
      })
      .then(() => {
        this.requestList();
      });
  }
  setDefaultState(data: any) {
    this.#client.environment.pythonAddon.setPlayerState.query(data).then(() => {
      this.requestList();
    });
  }
  saveIndexTTSEmo(data?: any) {
    const ref = this.dialog.open(IndexTTSEmoConfigComponent, {
      data: {
        data: data,
        save: (data: any) => {
          return this.#client.tts.indexttsEmo.set.query({
            ...data,
            id: data?.id,
          });
        },
      },
    });
    ref.afterClosed().subscribe((a) => {
      if (a) {
        this.requestList();
      }
    });
  }
  removeIndexTTSEmo(data: any) {
    return this.#client.tts.indexttsEmo.remove.query(data.id).then(() => {
      this.requestList();
    });
  }
}
