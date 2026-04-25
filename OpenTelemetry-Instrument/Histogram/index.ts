import {
  AggregationTemporality,
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  defaultResource,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { metrics } from "@opentelemetry/api";

const ENDPOINT = process.env.COLLECTOR_ENDOPOINT;

const resource = defaultResource().merge(
  resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "hg-test-hg-service",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  })
);

const reader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: `${ENDPOINT}/v1/metrics`,
    headers: {},
    temporalityPreference: AggregationTemporality.DELTA
  }),
  exportIntervalMillis: 2000,
});

const provider = new MeterProvider({
  resource: resource,
  readers: [reader],
});

metrics.setGlobalMeterProvider(provider);

const meter = metrics.getMeter("demo-histogram");

const histogram = meter.createHistogram("http.response.duration_delta", {
  description: "The duration of the request",
  unit: "ms",
  advice: {
    explicitBucketBoundaries: [5, 10, 20, 50],
  },
});

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

let count = 0;
const MAX_RECORDS = 20;

const interval = setInterval(async () => {
  histogram.record(1);
  histogram.record(15);
  count++;
  console.log(`Recorded ${count}/${MAX_RECORDS}`);

  if (count >= MAX_RECORDS) {
    clearInterval(interval);
    console.log("Done recording, flushing...");
    await reader.forceFlush();
    console.log("Flushed, exiting");
    process.exit(0);
  }
}, 1000);