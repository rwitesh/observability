kubectl apply -f k8s.yaml
kubectl apply -f secret.yaml
kubectl apply -f collector.yaml

kubectl rollout restart daemonset/otel-collector