interface TimeSeriesSample {
  ts: number; // Unix timestamp in seconds
  value: number;
}

interface TimeSeries {
  labels: Record<string, string>;
  samples: TimeSeriesSample[];
}

function rate(
  series: TimeSeries,
  rangeStart: number,
  rangeEnd: number
): number | null {
  if (rangeStart >= rangeEnd) return null;

  const samples = series.samples.filter(
    (s) => s.ts >= rangeStart && s.ts <= rangeEnd
  );
  if (samples.length < 2) return null;
  const numSamples = samples.length;
  if (numSamples < 2) return null;

  const first = samples[0]!;
  const last = samples[numSamples - 1]!;

  let result = 0;
  let prev = first.value;

  for (let i = 1; i < numSamples; i++) {
    const curr = samples[i]!;
    if (curr.value < prev) {
      result += curr.value; // counter reset
    } else {
      result += curr.value - prev;
    }
    prev = curr.value;
  }

  const firstT = first.ts;
  const lastT = last.ts;

  const sampledInterval = lastT - firstT;
  if (sampledInterval <= 0) return null;

  const numSamplesMinusOne = numSamples - 1;
  const avgStep = sampledInterval / numSamplesMinusOne;

  const durationToStart = firstT - rangeStart;
  const durationToEnd = rangeEnd - lastT;
  const extrapolationThreshold = avgStep * 1.1;

  let extrapolatedStart = durationToStart;
  let extrapolatedEnd = durationToEnd;

  if (durationToStart >= extrapolationThreshold) {
    extrapolatedStart = avgStep / 2;
  }
  if (durationToEnd >= extrapolationThreshold) {
    extrapolatedEnd = avgStep / 2;
  }

  let durationToZero = extrapolatedStart;
  if (result > 0 && first.value >= 0) {
    durationToZero = sampledInterval * (first.value / result);
  }
  if (durationToZero < extrapolatedStart) {
    extrapolatedStart = durationToZero;
  }

  const totalInterval = sampledInterval + extrapolatedStart + extrapolatedEnd;
  const rate =
    (result * (totalInterval / sampledInterval)) / (rangeEnd - rangeStart);
  return rate;
}

const input1: TimeSeries = {
  labels: { job: "api" },
  samples: [
    { ts: 1000, value: 5.0 },
    { ts: 2000, value: 15.0 },
  ],
};

const output1 = rate(input1, 1000, 2000);
console.log("Rate (input1):", output1);
