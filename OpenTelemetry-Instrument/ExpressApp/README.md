# OpenTelemetry Instrumented Express App (with Bun + TypeScript)

This project demonstrates how to instrument a simple **Express.js** application using [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/).  

The setup uses **Bun** for faster development and TypeScript support.

The example follows the official OpenTelemetry docs, and the same instrumentation can be applied to other Node.js-based frameworks.

---

## Requirements
- [Bun](https://bun.sh/) installed
- A running [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) or compatible endpoint
---

## Environment Setup
Create a `.env` file in the root of the project and specify the collector endpoint:
```env
COLLECTOR_ENDPOINT='http://localhost:4318'
````
---

## Installing Package
To install bun packages
```sh
bun install
```

## Running the App
Start the development server with:
```sh
bun run dev
```