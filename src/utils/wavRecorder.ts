/**
 * Encode mono Float32 PCM samples into a 16-bit WAV Blob (lecture fiable dans tous les navigateurs).
 */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export function measurePeakAmplitude(samples: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) {
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  return peak;
}

export type WavRecorderSession = {
  stop: () => Promise<{ blob: Blob; peak: number; sampleRate: number }>;
  getLevel: () => number;
  abort: () => void;
};

export async function startWavRecorder(onLevel?: (level: number) => void): Promise<WavRecorderSession> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: true,
    },
  });

  const audioContext = new AudioContext();
  await audioContext.resume();

  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.4;

  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const muteGain = audioContext.createGain();
  muteGain.gain.value = 0;

  const buffers: Float32Array[] = [];
  let lastLevel = 0;
  let stopped = false;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const input = event.inputBuffer.getChannelData(0);
    buffers.push(new Float32Array(input));

    const timeData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeData);
    let sum = 0;
    for (let i = 0; i < timeData.length; i += 1) {
      const normalized = (timeData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    lastLevel = Math.sqrt(sum / timeData.length);
    onLevel?.(lastLevel);
  };

  source.connect(analyser);
  analyser.connect(processor);
  processor.connect(muteGain);
  muteGain.connect(audioContext.destination);

  const abort = () => {
    stopped = true;
    processor.disconnect();
    analyser.disconnect();
    source.disconnect();
    muteGain.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    void audioContext.close();
  };

  const stop = async () => {
    stopped = true;
    processor.disconnect();
    analyser.disconnect();
    source.disconnect();
    muteGain.disconnect();
    stream.getTracks().forEach((track) => track.stop());

    const sampleRate = audioContext.sampleRate;
    await audioContext.close();

    const totalLength = buffers.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of buffers) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const peak = measurePeakAmplitude(merged);
    const blob = encodeWav(merged, sampleRate);
    return { blob, peak, sampleRate };
  };

  return {
    stop,
    getLevel: () => lastLevel,
    abort,
  };
}

/** Lecture de secours via Web Audio API. */
export async function playBlobWithWebAudio(blob: Blob): Promise<void> {
  const audioContext = new AudioContext();
  await audioContext.resume();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  await new Promise<void>((resolve) => {
    source.onended = () => {
      void audioContext.close();
      resolve();
    };
    source.start(0);
  });
}
