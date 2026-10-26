import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  Music, 
  Layers, 
  Zap, 
  Clock, 
  ShieldAlert, 
  Sliders, 
  Radio, 
  Check, 
  Copy,
  ChevronRight,
  GitBranch
} from 'lucide-react';
import { ARCHITECTURE_SECTIONS, DUAL_CORE_TASKS } from '../data/architectureDocs';

export function ArchitectureView() {
  const [activeTab, setActiveTab] = useState<'overview' | 'dualcore' | 'hardware' | 'flow'>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg max-w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          1. Project Breakdown & Comparison
        </button>
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'flow'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          2. Integration Pipeline Flow
        </button>
        <button
          onClick={() => setActiveTab('dualcore')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'dualcore'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          3. Dual-Core Task Affinity
        </button>
        <button
          onClick={() => setActiveTab('hardware')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'hardware'
              ? 'bg-slate-800 text-cyan-400 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          4. Hardware Bottlenecks & SRAM/PSRAM
        </button>
      </div>

      {/* TAB 1: OVERVIEW & COMPARISON */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project A: FM1 Cartridge */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                    <Music className="w-4 h-4" />
                    <span>andrerezemini/fm1-cartridge</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">M-VAVE FM-1 Synthesizer USB Cartridge</h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">v1.2+ / ESP-IDF 5.x</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Operates as an audio DSP synthesizer engine and USB MIDI Host for the M-VAVE FM-1 or standalone MIDI keyboards. Computes PCM audio buffers in real time and streams over I2S to an external audio DAC.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-200">Key Subsystems & Roles:</h4>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">·</span>
                    <span><strong>USB Host Controller:</strong> Drives ESP32-S3 native USB OTG (GPIO 19/20) to enumerate USB class 01 (Audio/MIDI) devices and pull MIDI event streams without host PC.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">·</span>
                    <span><strong>DSP Synth Engines:</strong> Ported sound engines including <em>Clipper</em> (overdriven wave-folding), <em>Melodee</em> (wavetable subtractive), and <em>Felucca</em> (polyphonic algorithmic FM).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">·</span>
                    <span><strong>I2S Audio Pipeline:</strong> Continuous stereo DMA ringbuffer delivering 16/24-bit 44.1 kHz PCM to audio DAC (PCM5102, ES8388, MAX98357A).</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Project B: ESP Ableton Link Component */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                    <Radio className="w-4 h-4" />
                    <span>docwilco/esp_abl_link</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">ESP Ableton Link Component</h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">C++17 / FreeRTOS</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                C++ ESP-IDF port of Ableton Link protocol. Discovers musical peers across local Wi-Fi via UDP multicast (Port 20808) and synchronizes beat, tempo, and quantum phase with microsecond accuracy.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-200">Key Subsystems & Roles:</h4>
                <ul className="text-xs text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">·</span>
                    <span><strong>UDP Multicast Engine:</strong> Socket listening on port 20808 sending low-overhead heartbeat and ping packets across 802.11 Wi-Fi.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">·</span>
                    <span><strong>Phase-Locked Clock Filter:</strong> Uses ESP32 64-bit hardware microsecond timer (<code className="text-cyan-300 font-mono">esp_timer_get_time()</code>) to calculate linear regression of peer clock offsets.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">·</span>
                    <span><strong>Quantum Phase Model:</strong> Calculates beat progress within 4-beat or 8-beat musical bars, allowing synths, sequencers, and LFOs to stay locked in groove.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Value proposition of combination */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-xl space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              The Combined Powerhouse: Autonomous Wireless Jamming Machine
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              By combining these two repositories onto an ESP32-S3, your M-VAVE FM-1 cartridge ceases to be an isolated USB box. It automatically locks its internal arpeggiator, LFO modulation, and step sequencer to whatever Ableton Live session, Elektron box, or iPad sequencer is currently playing on the local Wi-Fi, while keeping the native USB MIDI keyboard responsiveness and high-fidelity 44.1kHz audio output.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: PIPELINE FLOW */}
      {activeTab === 'flow' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">System Signal & Data Architecture</h3>
              <p className="text-xs text-slate-400 mt-1">
                How Wi-Fi network packets, USB MIDI bytes, and audio DMA streams interact without blocking each other.
              </p>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-950 border border-cyan-900/60 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                  <span>STAGE 1</span>
                  <span>Core 0</span>
                </div>
                <h4 className="text-sm font-bold text-white">Wi-Fi & Ableton Link</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Receives UDP multicast packets on port 20808. Updates peer count, session tempo, and microsecond clock regression.
                </p>
                <div className="text-[10px] text-cyan-300 font-mono bg-cyan-950/50 p-1.5 rounded border border-cyan-800/40">
                  Rate: ~50 Hz UDP ping
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>STAGE 2</span>
                  <span>Cross-Core</span>
                </div>
                <h4 className="text-sm font-bold text-white">Atomic State Snapshot</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Lock-free struct snapshot stores current BPM, beat, and phase. Audio core reads this with <code className="text-cyan-300">std::atomic</code> without mutex contention.
                </p>
                <div className="text-[10px] text-slate-300 font-mono bg-slate-900 p-1.5 rounded border border-slate-800">
                  Latency: &lt; 10 nanoseconds
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-amber-900/60 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-amber-400">
                  <span>STAGE 3</span>
                  <span>Core 1</span>
                </div>
                <h4 className="text-sm font-bold text-white">FM1 Audio Engine</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Synthesizes 64 samples at 44.1kHz. Arpeggiator note triggers and LFO rates are evaluated directly against the Link phase.
                </p>
                <div className="text-[10px] text-amber-300 font-mono bg-amber-950/50 p-1.5 rounded border border-amber-800/40">
                  Chunk: 1.45ms deadline
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-emerald-900/60 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                  <span>STAGE 4</span>
                  <span>Hardware DMA</span>
                </div>
                <h4 className="text-sm font-bold text-white">I2S Audio Output</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Streams 16-bit stereo PCM via DMA hardware FIFO to external DAC (PCM5102 / ES8388) with zero CPU intervention during transfer.
                </p>
                <div className="text-[10px] text-emerald-300 font-mono bg-emerald-950/50 p-1.5 rounded border border-emerald-800/40">
                  Rate: 44.1 kHz / 16-bit
                </div>
              </div>
            </div>

            {/* Folder Layout Structure */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-200">Recommended Project Directory Layout:</h4>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 space-y-1">
                <div>esp32s3_fm1_link_synth/</div>
                <div className="pl-4 text-slate-500">├── CMakeLists.txt <span className="text-slate-600">// Root CMake build script</span></div>
                <div className="pl-4 text-slate-500">├── partitions.csv <span className="text-slate-600">// Partition table (app, nvs, spiffs)</span></div>
                <div className="pl-4 text-slate-500">├── sdkconfig.defaults <span className="text-slate-600">// 240MHz, Dual-core, Wi-Fi PS NONE</span></div>
                <div className="pl-4 text-slate-500">├── components/</div>
                <div className="pl-8 text-cyan-400">├── esp_abl_link/ <span className="text-slate-600">// docwilco/esp_abl_link submodule</span></div>
                <div className="pl-8 text-amber-400">├── fm1_synth/ <span className="text-slate-600">// Clipper, Melodee, Felucca DSP engines</span></div>
                <div className="pl-8 text-slate-300">└── usb_midi_host/ <span className="text-slate-600">// USB Host OTG MIDI driver</span></div>
                <div className="pl-4 text-slate-500">└── main/</div>
                <div className="pl-8 text-emerald-400">├── main.cpp <span className="text-slate-600">// Core 0 & Core 1 task allocation & app_main</span></div>
                <div className="pl-8 text-slate-300">└── CMakeLists.txt</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DUAL-CORE TASK AFFINITY */}
      {activeTab === 'dualcore' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Dual-Core Xtensa LX7 Task Partitioning</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Strict thread isolation prevents Wi-Fi beacon jitter from causing audio under-runs.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  Core 0: Network & System
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Core 1: Audio DSP Engine
                </span>
              </div>
            </div>

            {/* Task Allocation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2.5 px-3">Task Name</th>
                    <th className="py-2.5 px-3">Core Affinity</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Stack Size</th>
                    <th className="py-2.5 px-3">Execution Period</th>
                    <th className="py-2.5 px-3">Description & Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {DUAL_CORE_TASKS.map((task) => (
                    <tr key={task.name} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white">
                        {task.name}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          task.core === 0 
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                            : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                        }`}>
                          Core {task.core}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 tabular-nums">
                        {task.priority}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {task.stackSize}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {task.period}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300 text-[11px]">
                        {task.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Why Core 0 & Core 1 Separation Matters */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                The Core Contention Mechanism (Why this is mandatory):
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                The Espressif Wi-Fi MAC layer and hardware radio interrupts are pinned by the ROM to <strong>Core 0</strong>. During normal Wi-Fi operation, beacon receptions and DTIM wakeups execute high-priority ISRs on Core 0 that can monopolize execution for <strong>5ms to 20ms</strong> at a time. If your audio rendering loop was running on Core 0, the I2S DMA FIFO (which empties in ~1.45ms for a 64-sample buffer) would starve, resulting in continuous audible clicks, pops, and stuttering. By locking audio calculation to <strong>Core 1</strong>, Core 1 never experiences Wi-Fi interrupts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HARDWARE BOTTLENECKS & MEMORY */}
      {activeTab === 'hardware' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SRAM vs PSRAM Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
                <Layers className="w-4 h-4" />
                <span>Memory Subsystem Rules</span>
              </div>
              <h3 className="text-base font-bold text-white">Internal SRAM vs Octal PSRAM</h3>
              
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="font-semibold text-emerald-400">Internal SRAM (384 KB available)</div>
                  <p className="text-slate-400">
                    Mandatory for all I2S DMA buffers, active voice oscillator accumulators, and ringbuffer descriptors. Zero-wait-state access. Must be allocated with:
                  </p>
                  <code className="block bg-slate-900 p-1.5 rounded font-mono text-cyan-300 text-[11px]">
                    heap_caps_malloc(buf_len, MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL);
                  </code>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="font-semibold text-amber-400">Octal PSRAM (2MB / 8MB)</div>
                  <p className="text-slate-400">
                    High bandwidth but unpredictable latency (cache miss = 15-40 CPU stall cycles). Use strictly for static wavetable banks, reverb delay lines, and sample soundbanks. <strong>Never</strong> run inner DSP sample calculation loops directly on uncached PSRAM pointers.
                  </p>
                </div>
              </div>
            </div>

            {/* Pin Collision & Wi-Fi Jitter */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
                <Sliders className="w-4 h-4" />
                <span>Hardware Pin & RF Safety</span>
              </div>
              <h3 className="text-base font-bold text-white">GPIO Mapping & Power Save Fix</h3>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="font-semibold text-slate-200">Avoid Native USB Pin Clashes:</div>
                  <p className="text-slate-400">
                    ESP32-S3 USB OTG uses <span className="font-mono text-white">GPIO 19 (D-)</span> and <span className="font-mono text-white">GPIO 20 (D+)</span>. Wire your I2S DAC cleanly away from them:
                  </p>
                  <ul className="text-[11px] font-mono text-slate-300 list-disc list-inside space-y-0.5 pt-1">
                    <li>I2S BCLK  -&gt; GPIO 4</li>
                    <li>I2S LRCK  -&gt; GPIO 5</li>
                    <li>I2S DOUT  -&gt; GPIO 6</li>
                    <li>I2S MCLK  -&gt; GPIO 0 or none (if DAC internal PLL)</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="font-semibold text-rose-400">Wi-Fi Power Save (Must Disable!):</div>
                  <p className="text-slate-400">
                    ESP-IDF defaults to modem sleep, dropping Wi-Fi packets between DTIMs. Ableton Link requires continuous low-latency UDP. Always add:
                  </p>
                  <code className="block bg-slate-900 p-1.5 rounded font-mono text-cyan-300 text-[11px]">
                    esp_wifi_set_ps(WIFI_PS_NONE);
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
