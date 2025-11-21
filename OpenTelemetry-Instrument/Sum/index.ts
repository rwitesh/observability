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
    [ATTR_SERVICE_NAME]: "hg-test-sum-service",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  })
);

const reader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: `${ENDPOINT}/v1/metrics`,
    headers: {},
    temporalityPreference: AggregationTemporality.DELTA
  }),
  exportIntervalMillis: 1000,
});

const provider = new MeterProvider({
  resource: resource,
  readers: [reader],
});

metrics.setGlobalMeterProvider(provider);

const meter = metrics.getMeter("demo-histogram");

const sum = meter.createCounter('request.sum', {
  description: "The sum of requests",
  unit: "1"
});

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

setInterval(() => {
  const value = randomInRange(1, 10);
  sum.add(value);
  console.log(`Recorded value: ${value}`);
}, 5000);
