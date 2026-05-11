import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import WaveSurfer, { WaveSurferOptions } from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { process_audio } from './audio/utils';
import { audioBufferToWav } from './audio/audioBufferToWav';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

@Directive({
  selector: '[audioPlayer]',
  standalone: true,
  exportAs: 'audioPlayer',
})
export class AudioPlayerDirective {
  maxDuration = input.required<number>();
  audioPlayer = input<Omit<WaveSurferOptions, 'container'>>();
  data = input<any>();
  #el = inject(ElementRef);
  audioChange = output<AudioBuffer | Uint8Array>();
  finish = output();
  wavesurfer?: WaveSurfer;
  #regions = RegionsPlugin.create();
  #current$ = signal(0);
  #duration$ = signal(0);
  timeDisplay$$ = computed(() => {
    return `${dayjs.duration(this.#current$(), 'second').format('mm:ss')}/${dayjs.duration(this.#duration$(), 'second').format('mm:ss')}`;
  });
  trimDisplay$$ = signal('');
  toLarge$ = signal(false);
  #objUrl?: string;
  ngOnChanges(): void {
    this.#dispose();
    if (!this.data()) {
      return;
    }
    this.#objUrl = URL.createObjectURL(this.data());

    // 设计上说会重新渲染,但是实际上没有变化
    //   this.wavesurfer.setOptions({
    //     ...this.audioPlayer(),
    //     url: recordedUrl,
    //   });
    this.setWaveSurfer();
  }
  #dispose() {
    this.wavesurfer?.destroy();
    this.wavesurfer = undefined;
    if (this.#objUrl) {
      URL.revokeObjectURL(this.#objUrl);
      this.#objUrl = undefined;
    }
    this.clearRegion();
  }
  setWaveSurfer() {
    this.wavesurfer = WaveSurfer.create({
      container: this.#el.nativeElement,
      ...this.audioPlayer(),
      url: this.#objUrl,
      plugins: [this.#regions],
    });
    this.wavesurfer.on('decode', (data) => {
      this.#duration$.set(data);
      const toLarge = this.maxDuration() < data;
      this.toLarge$.set(toLarge);
      if (toLarge) {
        return;
      }
      this.audioChange.emit(this.wavesurfer!.getDecodedData()!);
    });
    this.wavesurfer.on('finish', () => {
      this.finish.emit();
    });
    this.wavesurfer.on('seeking', (currentTime) => {
      this.#current$.set(currentTime);
    });
  }
  addRegion() {
    this.clearRegion();
    const start = this.#duration$() * 0.2;
    const end = this.#duration$() * 0.8;
    this.#regions.addRegion({
      start: start,
      end: end,
      color: '#007acc4d',
      drag: true,
      resize: true,
    });
    this.trimDisplay$$.set(
      `${dayjs.duration(start, 'second').format('mm:ss')}=>${dayjs.duration(end, 'second').format('mm:ss')}`,
    );
    this.#regions.on('region-updated', (region) => {
      this.trimDisplay$$.set(
        `${dayjs.duration(region.start, 'second').format('mm:ss')}=>${dayjs.duration(region.end, 'second').format('mm:ss')}`,
      );
    });
  }
  clearRegion() {
    this.#regions.clearRegions();
  }
  async trim() {
    const region = this.#regions.getRegions()[0];
    const decodedData = this.wavesurfer!.getDecodedData()!;
    this.wavesurfer!.getDecodedData();
    return await process_audio(decodedData, region.start, region.end).then(
      async (audioBuffer) => {
        this.#dispose();
        const unit8 = audioBufferToWav(audioBuffer);
        this.#objUrl = URL.createObjectURL(new Blob([unit8]));
        this.setWaveSurfer();
      },
    );
  }
  ngOnDestroy(): void {
    this.#dispose();
  }
}
