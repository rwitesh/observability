package main

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/cespare/xxhash/v2"
)

func attributesToString(attributes map[string]string) string {
	if len(attributes) == 0 {
		return ""
	}
	keys := make([]string, 0, len(attributes))
	for k := range attributes {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sb strings.Builder
	for _, k := range keys {
		sb.WriteString(k)
		sb.WriteString("=")
		sb.WriteString(attributes[k])
		sb.WriteString(";")
	}
	return sb.String()
}

func GenerateFingerprint(metricName string, attributes map[string]string) uint64 {
	hash := xxhash.New()
	hash.Write([]byte(metricName))
	hash.Write([]byte(attributesToString(attributes)))
	return hash.Sum64()
}

func main() {
	// Python-style string → replace ' with "
	jsonStr := `{"cpu":"cpu4","state":"interrupt"}`

	var attrs map[string]string
	if err := json.Unmarshal([]byte(jsonStr), &attrs); err != nil {
		panic(err)
	}

	fp := GenerateFingerprint("your_metric_name", attrs)
	fmt.Println("Attributes string:", attributesToString(attrs))
	fmt.Println("Fingerprint:", fp)
}
