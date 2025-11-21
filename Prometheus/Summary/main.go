package main

import (
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	// Native Prometheus Summary
	requestLatency := prometheus.NewSummary(
		prometheus.SummaryOpts{
			Name:       "demo_request_latency_seconds",
			Help:       "Request latency in seconds",
			Objectives: map[float64]float64{0.5: 0.01, 0.9: 0.01, 0.99: 0.001},
		},
	)

	// Register it
	prometheus.MustRegister(requestLatency)

	// Simulate workload that records latency
	go func() {
		for {
			lat := time.Duration(50+rand.Intn(250)) * time.Millisecond
			time.Sleep(lat)
			requestLatency.Observe(float64(lat) / float64(time.Second))
		}
	}()

	// Expose metrics
	http.Handle("/metrics", promhttp.Handler())

	log.Println("serving metrics on :8080/metrics")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
