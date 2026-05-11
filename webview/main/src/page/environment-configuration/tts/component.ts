import { Component } from '@angular/core';

import { MatTabsModule } from '@angular/material/tabs';
import { PythonAddonInstallComponent } from './python-addon/component';
import { IndexTTSComponent } from './index-tts/component';
import { PlayerListComponent } from './player-list/component';
@Component({
  selector: 'app-python-addon',
  templateUrl: './component.html',
  imports: [
    MatTabsModule,
    PythonAddonInstallComponent,
    IndexTTSComponent,
    PlayerListComponent,
  ],
})
export class PythonAddonComponent {}
