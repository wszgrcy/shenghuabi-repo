import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { InstallConfigurationComponent } from './install/component';
import { DirComponent } from './dir/component';
import { TrpcService } from '@fe/trpc';
import { OCRInstallConfigurationComponent } from './ocr-install/component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { PythonAddonComponent } from './tts/component';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatStepperModule,
    MatButtonModule,
    InstallConfigurationComponent,
    DirComponent,
    OCRInstallConfigurationComponent,
    MatTooltipModule,
    MatTabsModule,
    PythonAddonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EnvironmentComponent implements OnInit {
  #client = inject(TrpcService).client;
  defaultDirInited$ = signal(false);
  index$ = signal(0);
  constructor() {}

  ngOnInit(): void {
    this.#client.environment.getDefaultDir.query(undefined).then((value) => {
      if (value) {
        this.defaultDirInited$.set(true);
        this.index$.set(1);
      }
    });
  }
  dirChanged(value: string) {
    this.defaultDirInited$.set(!!value);
  }
  next(index: number) {
    this.index$.set(index);
    this.defaultDirInited$.set(true);
  }
}
