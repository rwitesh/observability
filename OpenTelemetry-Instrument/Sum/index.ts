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

const ENDPOINT = process.env.COLLECTOR_ENDPOINT;

const resource = defaultResource().merge(
  resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "hg-test-sum-service",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),
);

const provider = new MeterProvider({
  resource,
  readers: [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${ENDPOINT}/v1/metrics`,
        headers: {},
        temporalityPreference: AggregationTemporality.DELTA,
      }),
      exportIntervalMillis: 5000,
    }),
  ],
});

metrics.setGlobalMeterProvider(provider);

const meter = metrics.getMeter("demo-sum");

const requestCounter = meter.createUpDownCounter(`km.request.sum.delta`, {
  description: "The sum of requests",
  unit: "1",
});

setInterval(() => {
  requestCounter.add(1, { route: "/api/users" });
  requestCounter.add(1, { route: "/api/orders" });
  console.log("Recorded 1 for both series");
}, 5000);
