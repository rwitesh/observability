#!/bin/bash
set -a
source .env
set +a

# Substitute env vars into secret.yaml and pipe directly to kubectl
envsubst < secret.yaml | kubectl apply -f -

kubectl apply -f k8s.yaml
kubectl apply -f collector.yaml

kubectl rollout restart daemonset/otel-collector