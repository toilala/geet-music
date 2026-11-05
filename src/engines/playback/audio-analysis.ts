export type AudioAnalysis = {
  rms: number;
  peak: number;
  isSilent: boolean;
  estimatedBpm: number | null;
};

/** Portable signal-analysis subset of Echo's BeatAnalyzer/SilenceDetector. */
export function analyzePcm16(samples: Int16Array, sampleRate: number, silenceThreshold = 0.008): AudioAnalysis {
  if (!samples.length || sampleRate <= 0) return { rms: 0, peak: 0, isSilent: true, estimatedBpm: null };
  let sumSquares = 0;
  let peak = 0;
  const envelope: number[] = [];
  const window = Math.max(1, Math.floor(sampleRate / 100));
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.abs(samples[index]) / 32768;
    peak = Math.max(peak, value);
    sumSquares += value * value;
    if (index % window === window - 1) envelope.push(value);
  }
  const rms = Math.sqrt(sumSquares / samples.length);
  const threshold = Math.max(silenceThreshold, rms * 1.5);
  let peaks = 0;
  for (let index = 1; index < envelope.length - 1; index += 1) {
    if (envelope[index] > threshold && envelope[index] >= envelope[index - 1] && envelope[index] >= envelope[index + 1]) peaks += 1;
  }
  const seconds = samples.length / sampleRate;
  const estimatedBpm = seconds >= 2 && peaks > 0 ? Math.max(40, Math.min(220, peaks / seconds * 60)) : null;
  return { rms, peak, isSilent: rms < silenceThreshold, estimatedBpm };
}
