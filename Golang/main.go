// main.go
// Collects extensive macOS OS + hardware information using sysctl, uname,
// and native Apple tools. Intended for diagnostics, telemetry, or licensing.
// Tested logic works on both Intel and Apple Silicon.

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"golang.org/x/sys/unix"
)

/* ----------------------------- helpers ----------------------------- */

func bytesToString(b []byte) string {
	n := 0
	for ; n < len(b); n++ {
		if b[n] == 0 {
			break
		}
	}
	return string(b[:n])
}
func sysctlString(name string) string {
	v, err := unix.Sysctl(name)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(v)
}

func sysctlUint64(name string) uint64 {
	v, err := unix.SysctlUint64(name)
	if err != nil {
		return 0
	}
	return v
}

func runCmd(name string, args ...string) string {
	cmd := exec.Command(name, args...)
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}

/* ----------------------------- data models ----------------------------- */

type UnameInfo struct {
	Sysname  string `json:"sysname"`
	Release  string `json:"release"`
	Version  string `json:"version"`
	Machine  string `json:"machine"`
	Nodename string `json:"nodename"`
}

type CPUInfo struct {
	Brand         string `json:"brand"`
	Arch          string `json:"arch"`
	Cores         uint64 `json:"cores"`
	PhysicalCores uint64 `json:"physical_cores"`
	LogicalCores  uint64 `json:"logical_cores"`
	FrequencyHz   uint64 `json:"frequency_hz"`
}

type MemoryInfo struct {
	TotalBytes uint64 `json:"total_bytes"`
	PageSize   uint64 `json:"page_size"`
}

type OSInfo struct {
	GoOS         string `json:"go_os"`
	GoArch       string `json:"go_arch"`
	MacOSName    string `json:"macos_name"`
	MacOSVersion string `json:"macos_version"`
	Build        string `json:"build"`
	Kernel       string `json:"kernel"`
}

type HardwareInfo struct {
	Model        string `json:"model"`
	ModelName    string `json:"model_name"`
	Chip         string `json:"chip"`
	SerialNumber string `json:"serial_number"`
	HardwareUUID string `json:"hardware_uuid"`
}

type DiskInfo struct {
	BootVolume string `json:"boot_volume"`
}

type NetworkInfo struct {
	Hostname string `json:"hostname"`
}

type FullSystemInfo struct {
	Timestamp time.Time    `json:"timestamp"`
	OS        OSInfo       `json:"os"`
	Uname     UnameInfo    `json:"uname"`
	CPU       CPUInfo      `json:"cpu"`
	Memory    MemoryInfo   `json:"memory"`
	Hardware  HardwareInfo `json:"hardware"`
	Disk      DiskInfo     `json:"disk"`
	Network   NetworkInfo  `json:"network"`
}

/* ----------------------------- collectors ----------------------------- */

func getUname() UnameInfo {
	var u unix.Utsname
	_ = unix.Uname(&u)

	return UnameInfo{
		Sysname:  bytesToString(u.Sysname[:]),
		Release:  bytesToString(u.Release[:]),
		Version:  bytesToString(u.Version[:]),
		Machine:  bytesToString(u.Machine[:]),
		Nodename: bytesToString(u.Nodename[:]),
	}
}

func getOSInfo(uname UnameInfo) OSInfo {
	swVers := runCmd("sw_vers")

	var name, version, build string
	for _, line := range strings.Split(swVers, "\n") {
		if strings.HasPrefix(line, "ProductName:") {
			name = strings.TrimSpace(strings.TrimPrefix(line, "ProductName:"))
		}
		if strings.HasPrefix(line, "ProductVersion:") {
			version = strings.TrimSpace(strings.TrimPrefix(line, "ProductVersion:"))
		}
		if strings.HasPrefix(line, "BuildVersion:") {
			build = strings.TrimSpace(strings.TrimPrefix(line, "BuildVersion:"))
		}
	}

	return OSInfo{
		GoOS:         runtime.GOOS,
		GoArch:       runtime.GOARCH,
		MacOSName:    name,
		MacOSVersion: version,
		Build:        build,
		Kernel:       uname.Release,
	}
}

func getCPUInfo() CPUInfo {
	return CPUInfo{
		Brand:         sysctlString("machdep.cpu.brand_string"),
		Arch:          runtime.GOARCH,
		Cores:         sysctlUint64("hw.ncpu"),
		PhysicalCores: sysctlUint64("hw.physicalcpu"),
		LogicalCores:  sysctlUint64("hw.logicalcpu"),
		FrequencyHz:   sysctlUint64("hw.cpufrequency"),
	}
}

func getMemoryInfo() MemoryInfo {
	return MemoryInfo{
		TotalBytes: sysctlUint64("hw.memsize"),
		PageSize:   sysctlUint64("hw.pagesize"),
	}
}

func getHardwareInfo() HardwareInfo {
	// fast fields
	model := sysctlString("hw.model")

	// slow but rich (JSON)
	raw := runCmd("system_profiler", "SPHardwareDataType", "-json")
	var parsed map[string][]map[string]interface{}
	_ = json.Unmarshal([]byte(raw), &parsed)

	hw := HardwareInfo{
		Model: model,
	}

	if arr, ok := parsed["SPHardwareDataType"]; ok && len(arr) > 0 {
		m := arr[0]
		hw.ModelName, _ = m["machine_name"].(string)
		hw.Chip, _ = m["chip_type"].(string)
		hw.SerialNumber, _ = m["serial_number"].(string)
		hw.HardwareUUID, _ = m["platform_UUID"].(string)
	}

	return hw
}

func getDiskInfo() DiskInfo {
	boot := runCmd("diskutil", "info", "/")
	for _, line := range strings.Split(boot, "\n") {
		if strings.Contains(line, "Volume Name:") {
			return DiskInfo{
				BootVolume: strings.TrimSpace(strings.SplitN(line, ":", 2)[1]),
			}
		}
	}
	return DiskInfo{}
}

func getNetworkInfo() NetworkInfo {
	h, _ := os.Hostname()
	return NetworkInfo{
		Hostname: h,
	}
}

/* ----------------------------- main ----------------------------- */

func main() {
	uname := getUname()

	info := FullSystemInfo{
		Timestamp: time.Now().UTC(),
		Uname:     uname,
		OS:        getOSInfo(uname),
		CPU:       getCPUInfo(),
		Memory:    getMemoryInfo(),
		Hardware:  getHardwareInfo(),
		Disk:      getDiskInfo(),
		Network:   getNetworkInfo(),
	}

	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetIndent("", "  ")
	_ = enc.Encode(info)

	fmt.Println(buf.String())
}
