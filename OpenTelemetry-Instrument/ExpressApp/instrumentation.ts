/*instrumentation.ts*/
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";

const ENDPOINT = process.env.COLLECTOR_ENDOPOINT

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: `${ENDPOINT}/v1/traces`,
    headers: {},
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${ENDPOINT}/v1/metrics`,
      headers: {},
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
