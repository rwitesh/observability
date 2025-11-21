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
  exportIntervalMillis: 5000,
});

const provider = new MeterProvider({
  resource: resource,
  readers: [reader],
});

metrics.setGlobalMeterProvider(provider);

const meter = metrics.getMeter("demo-histogram");

const histogram = meter.createHistogram("kloudmate.duration", {
  description: "The duration of the request",
  unit: "ms",
  advice: {
    explicitBucketBoundaries: [5, 10, 20, 50, 100],
  },
});

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

setInterval(() => {
  const value = randomInRange(1, 100);
  histogram.record(value);
  console.log(`Recorded value: ${value}`);
}, 1000);
