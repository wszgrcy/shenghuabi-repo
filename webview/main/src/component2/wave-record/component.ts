import {
  Component,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';

import { AsyncPipe } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AudioPlayerDirective } from './audio-player.directive';
import { WaveSurferCommonOptions } from './type';

import { audioBufferToWav } from './audio/audioBufferToWav';
import { BaseControl } from '@piying/view-angular';

const DefaultConfig: WaveSurferCommonOptions = {
  height: 50,
  sampleRate: 44100,
  barWidth: 2,
  barGap: 3,
  cursorWidth: 2,
  cursorColor: '#ddd5e9',
  autoplay: false,
  barRadius: 10,
  dragToSeek: true,
  // normalize: true,
  minPxPerSec: 0,
};
@Component({
  selector: 'wave-record',
  templateUrl: './component.html',
  imports: [
    AsyncPipe,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    AudioPlayerDirective,
  ],
  styleUrl: './component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WaveRecordFCC),
      multi: true,
    },
  ],
})
export class WaveRecordFCC extends BaseControl {
  maxDuration = input<number>(999999);
  maxDurationTooltip = input<string>();
  mic = viewChild.required<ElementRef<HTMLElement>>('mic');
  audioPlayer = viewChild<AudioPlayerDirective>('audioPlayer');
  device$ = signal<string | undefined>(undefined);
  /** 录音切换 */
  isRecording$ = signal(false);
  /** 播放切换 */
  isPlaying$ = signal(false);
  /** 是否有音频 */
  hasAudio$ = signal(false);
  data$ = signal<any>(undefined);
  readonly defaultConfig = DefaultConfig;

  wavesurfer!: WaveSurfer;
  record!: RecordPlugin;
  deviceList$$ = RecordPlugin.getAvailableAudioDevices().then((devices) => {
    if (devices.length) {
      this.device$.set(devices[0].deviceId);
    }
    return devices.map((device) => {
      return { label: device.label || device.deviceId, value: device.deviceId };
    });
  });
  ngOnInit(): void {
    this.wavesurfer = WaveSurfer.create({
      container: this.mic().nativeElement,
      ...DefaultConfig,
    });
    this.record = this.wavesurfer.registerPlugin(
      RecordPlugin.create({
        renderRecordedAudio: false,
        scrollingWaveform: false,
      }),
    );

    this.record.on('record-end', (blob) => {
      // 停止发射,进入编辑
      this.data$.set(blob);
      this.hasAudio$.set(true);
    });
  }

  toggleRecord() {
    this.isRecording$.update((a) => !a);
    if (this.record.isRecording() || this.record.isPaused()) {
      this.isPasuseRecord$.set(false);
      this.record.stopRecording();
      return;
    }

    this.record.startRecording({ deviceId: this.device$() });
  }
  togglePlay() {
    this.isPlaying$.update((a) => !a);
    this.audioPlayer()!.wavesurfer!.playPause();
  }
  isPasuseRecord$ = signal(false);
  pasuseRecord() {
    this.isPasuseRecord$.update((a) => !a);

    if (this.record.isPaused()) {
      this.record.resumeRecording();
    } else {
      this.record.pauseRecording();
    }
  }
  fileInput(el: HTMLInputElement) {
    if (!el.files) {
      return;
    }
    const file = el.files[0];
    this.data$.set(file);
    el.value = '';

    this.hasAudio$.set(true);
  }
  isTriming$$ = signal(false);
  setTrim(value: boolean) {
    this.isTriming$$.set(value);
    if (value) {
      this.audioPlayer()!.addRegion();
    } else {
      this.audioPlayer()!.clearRegion();
    }
  }
  submitTrim() {
    this.isTriming$$.set(false);
    this.audioPlayer()!.trim();
  }
  audioChanged(value: any) {
    if (value instanceof Uint8Array) {
      this.valueChange(value);
    } else {
      this.valueChange(new Uint8Array(audioBufferToWav(value)));
    }
  }
  reset() {
    this.hasAudio$.set(false);
    this.isTriming$$.set(false);
    this.isPasuseRecord$.set(false);
    this.isPlaying$.set(false);
    this.isRecording$.set(false);
    this.valueChange(undefined);
  }
}

// 录音/上传=>裁剪
