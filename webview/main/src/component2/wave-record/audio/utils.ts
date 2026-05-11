export interface LoadedParams {
  autoplay?: boolean;
}

export const process_audio = async (
  audioBuffer: AudioBuffer,
  start?: number,
  end?: number,
  waveform_sample_rate?: number,
) => {
  const audioContext = new AudioContext({
    sampleRate: waveform_sample_rate || audioBuffer.sampleRate,
  });
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = waveform_sample_rate || audioBuffer.sampleRate;

  let trimmedLength = audioBuffer.length;
  let startOffset = 0;

  if (start && end) {
    startOffset = Math.round(start * sampleRate);
    const endOffset = Math.round(end * sampleRate);
    trimmedLength = endOffset - startOffset;
  }

  const trimmedAudioBuffer = audioContext.createBuffer(
    numberOfChannels,
    trimmedLength,
    sampleRate,
  );

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    const trimmedData = trimmedAudioBuffer.getChannelData(channel);
    for (let i = 0; i < trimmedLength; i++) {
      trimmedData[i] = channelData[startOffset + i];
    }
  }

  return trimmedAudioBuffer;
  //   return audioBufferToWav(trimmedAudioBuffer);
};
