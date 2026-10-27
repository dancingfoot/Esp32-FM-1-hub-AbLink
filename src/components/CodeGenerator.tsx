import React, { useState } from 'react';
import { FileCode, Copy, Check, Download } from 'lucide-react';
import { CODE_TEMPLATES } from '../data/architectureDocs';

export function CodeGenerator() {
  const [selectedFile, setSelectedFile] = useState<string>('mainCpp');
  const [copied, setCopied] = useState<boolean>(false);

  const files: Record<string, { name: string; lang: string; content: string; description: string }> = {
    mainCpp: {
      name: 'main/main.cpp',
      lang: 'cpp',
      content: CODE_TEMPLATES.mainCpp,
      description: 'Dual-core task orchestration: Core 0 (Ableton Link + Wi-Fi) and Core 1 (Real-time Audio DSP).',
    },
    audioMixerCpp: {
      name: 'main/audio_mixer.cpp',
      lang: 'cpp',
      content: CODE_TEMPLATES.audioMixerCpp,
      description: 'Multi-channel 32-bit floating point audio mixer summing multiple FM-1 USB streams on Core 1.',
    },
    usbHubDriver: {
      name: 'main/usb_hub_manager.cpp',
      lang: 'cpp',
      content: CODE_TEMPLATES.usbHubDriver,
      description: 'Multi-device USB Host enumeration using USB Hub class driver (FM1Buddy method).',
    },
    sdkconfig: {
      name: 'sdkconfig.defaults',
      lang: 'ini',
      content: CODE_TEMPLATES.sdkconfig,
      description: 'Critical configuration: 240MHz CPU, Dual-Core enabled, Wi-Fi Power Save NONE, C++17.',
    },
    cmakelists: {
      name: 'CMakeLists.txt (Root)',
      lang: 'cmake',
      content: CODE_TEMPLATES.cmakelists,
      description: 'Root ESP-IDF CMake project definition.',
    },
    componentCmake: {
      name: 'main/CMakeLists.txt',
      lang: 'cmake',
      content: CODE_TEMPLATES.componentCmake,
      description: 'Component registration requiring esp_abl_link, usb, driver, and esp_wifi.',
    },
    partitions: {
      name: 'partitions.csv',
      lang: 'csv',
      content: CODE_TEMPLATES.partitions,
      description: 'Custom partition table accommodating factory app binary (2.5MB) and SPIFFS web storage.',
    },
    githubActions: {
      name: '.github/workflows/build.yml',
      lang: 'yaml',
      content: `name: Build ESP32-S3 Firmware (Esp32-FM-1-hub-AbLink)

on:
  push:
    branches: [ main, master ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Build ESP-IDF Firmware (ESP32-S3)
    runs-on: ubuntu-latest
    container:
      # Official Espressif Docker container with pre-installed toolchain
      image: espressif/idf:release-v5.3

    steps:
      - name: Checkout repository & submodules
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0

      - name: Build ESP32-S3 Firmware
        run: |
          . $IDF_PATH/export.sh
          idf.py set-target esp32s3
          idf.py build

      - name: Upload firmware artifacts
        uses: actions/upload-artifact@v4
        with:
          name: Esp32-FM-1-hub-AbLink-firmware
          path: |
            build/*.bin
            build/*.elf
            build/bootloader/*.bin
            build/partition_table/*.bin
            build/flasher_args.json
          if-no-files-found: error

      - name: Package merged binary for Web Flashing
        run: |
          . $IDF_PATH/export.sh
          esptool.py --chip esp32s3 merge_bin -o build/merged-flash.bin @build/flash_args || true

      - name: Upload merged binary artifact
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: Esp32-FM-1-hub-AbLink-merged
          path: build/merged-flash.bin
          if-no-files-found: warn
`,
      description: 'GitHub Actions workflow for dancingfoot/Esp32-FM-1-hub-AbLink compiling firmware and packaging artifacts.',
    },
  };

  const current = files[selectedFile];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([current.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = current.name.split('/').pop() || 'file.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <FileCode className="w-4 h-4" />
            <span>Ready-to-Compile Source Templates</span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">
            ESP-IDF Starter Files & GitHub Actions CI
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* File selector tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
        {Object.entries(files).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setSelectedFile(key)}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap ${
              selectedFile === key
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* File metadata description */}
      <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between">
        <span>{current.description}</span>
        <span className="font-mono text-slate-500">{current.name}</span>
      </div>

      {/* Code viewer */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
        <div className="max-h-[480px] overflow-y-auto p-4 text-slate-300 leading-relaxed select-text">
          <pre>{current.content}</pre>
        </div>
      </div>
    </div>
  );
}
