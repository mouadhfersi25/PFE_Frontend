/** Lecture fiable via Web Audio API (fallback si <audio> muet). */
export async function playAudioBlob(blob: Blob): Promise<void> {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Web Audio non supporté');
  }

  const context = new AudioCtx();
  try {
    await context.resume();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    await new Promise<void>((resolve, reject) => {
      source.onended = () => resolve();
      try {
        source.start(0);
      } catch (err) {
        reject(err);
      }
    });
  } finally {
    await context.close().catch(() => undefined);
  }
}
