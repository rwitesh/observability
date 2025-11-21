import {
  AggregationType,
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
    [ATTR_SERVICE_NAME]: "hg-test-service",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  })
);

const reader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: `${ENDPOINT}/v1/metrics`,
    headers: {},
  }),
  exportIntervalMillis: 5000,
});

const provider = new MeterProvider({
  resource: resource,
  readers: [reader],
  views: [
    {
      aggregation: { type: AggregationType.EXPONENTIAL_HISTOGRAM,  options: {maxSize: 5}},
      instrumentName: "request-duration-exp",
    },
  ],
});

metrics.setGlobalMeterProvider(provider);

const meter = metrics.getMeter("demo-histogram");

const exponential_histogram = meter.createHistogram("request-duration-exp", {
  description: "The duration of the request",
  unit: "ms",
});

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

setInterval(() => {
  const value = randomInRange(-5, 10);
  exponential_histogram.record(value);
  console.log(`Recorded value: ${value}`);
}, 1000);
