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

const metric = 'km2.histogram'

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
    temporalityPreference: 0
  }),
  exportIntervalMillis: 5000,
});

const provider = new MeterProvider({
  resource: resource,
  readers: [reader],
  views: [
    {
      aggregation: { type: AggregationType.EXPONENTIAL_HISTOGRAM, options: {maxSize: 5}},
      instrumentName: metric,
    },
  ],
});

metrics.setGlobalMeterProvider(provider);

const meter = metrics.getMeter("demo-histogram");

const exponential_histogram = meter.createHistogram(metric, {
  description: "The duration of the request",
  unit: "ms",
});

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const samples = [3, 7, 5, 10, 5, 8, 11, 14, 6, 11, 20];

(async () => {
  for (const v of samples) {
    exponential_histogram.record(v);
    console.log(`Recorded value: ${v}`);
    await sleep(1000);
  }
  sleep(10000)
})();
