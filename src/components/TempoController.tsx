import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Music, 
  Activity, 
  Clock, 
  Zap, 
  RotateCcw, 
  Sliders, 
  ArrowRightLeft,
  Wifi,
  Globe
} from 'lucide-react';

export function TempoController() {
  const [bpm, setBpm] = useState<number>(124.0);
  const [peers, setPeers] = useState<number>(2);
  const [quantum, setQuantum] = useState<number>(4);
  const [beat, setBeat] = useState<number>(0);
  const [phase, setPhase] = useState<number>(0);

  // Dual-Tempo Presets
  const [presetA, setPresetA] = useState<number>(124.0);
  const [presetB, setPresetB] = useState<number>(140.0);
  const [activePreset, setActivePreset] = useState<'A' | 'B'>('A');

  // FM-1 Button / Screen Tap Tempo State
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [lastTapInterval, setLastTapInterval] = useState<number | null>(null);
  const [isTapping, setIsTapping] = useState<boolean>(false);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Network Netif mode
  const [netifMode, setNetifMode] = useState<'wifi' | 'eth01'>('wifi');

  // Real-time Link beat calculation
  useEffect(() => {
    const interval = setInterval(() => {
      const beatsPerSecond = bpm / 60;
      const step = (beatsPerSecond * 0.05);

      setBeat((prev) => (prev + step) % 16);
      setPhase((prev) => (prev + (step % 1.0)) % 1.0);
    }, 50);

    return () => clearInterval(interval);
  }, [bpm]);

  // Handle Tap Tempo (Screen Button or simulated FM-1 Hardware button)
  const handleTap = () => {
    const now = performance.now();
    setIsTapping(true);

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = setTimeout(() => {
      setIsTapping(false);
      setTapTimes([]);
    }, 2000);

    setTapTimes((prev) => {
      const updated = [...prev, now].slice(-5); // keep last 5 taps
      if (updated.length >= 2) {
        // Calculate average interval
        const intervals: number[] = [];
        for (let i = 1; i < updated.length; i++) {
          intervals.push(updated[i] - updated[i - 1]);
        }
        const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round((60000 / avgIntervalMs) * 10) / 10;
        
        if (calculatedBpm >= 40 && calculatedBpm <= 240) {
          setBpm(calculatedBpm);
          setLastTapInterval(Math.round(avgIntervalMs));
        }
      }
      return updated;
    });
  };

  const switchPreset = (preset: 'A' | 'B') => {
    setActivePreset(preset);
    const targetBpm = preset === 'A' ? presetA : presetB;
    setBpm(targetBpm);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Ableton Link Network Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
              <Radio className="w-4 h-4" />
              <span>Ableton Link Session · Core 0 UDP Multicast (Port 20808)</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Wireless Tempo & Phase Transport
            </h2>
            <p className="text-xs text-slate-400">
              Zero-jitter network beat master. Synchronizes FM-1 arpeggiators, sequencers, and LFOs without MIDI cable delay.
            </p>
          </div>

          {/* Network Interface Switch (Wi-Fi vs ETH01) */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setNetifMode('wifi')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                netifMode === 'wifi'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>Wi-Fi (Active)</span>
            </button>
            <button
              onClick={() => setNetifMode('eth01')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                netifMode === 'eth01'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>WT32-ETH01 (Ready)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Transport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tempo Master & Dual-Tempo Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live BPM & Transport Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Music className="w-4 h-4 text-cyan-400" />
                <span>Session Master Clock</span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-3">
                <span>Peers: <strong className="text-white">{peers}</strong></span>
                <span>·</span>
                <span>Jitter: <strong className="text-emerald-400">&lt; 65 µs</strong></span>
              </div>
            </div>

            {/* Giant BPM Readout & Nudge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-950 p-6 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-[11px] font-mono text-slate-500">SESSION TEMPO</span>
                <div className="text-5xl font-black text-white font-mono tracking-tight tabular-nums mt-1">
                  {bpm.toFixed(1)}
                  <span className="text-sm font-normal text-slate-500 ml-2">BPM</span>
                </div>
              </div>

              {/* Nudge & Slider */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBpm((prev) => Math.max(40, prev - 1))}
                  className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold font-mono text-sm transition-colors"
                >
                  -1
                </button>
                <button
                  onClick={() => setBpm((prev) => Math.min(240, prev + 1))}
                  className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold font-mono text-sm transition-colors"
                >
                  +1
                </button>
              </div>
            </div>

            {/* BPM Range Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>60 BPM</span>
                <span className="text-cyan-400 font-semibold">{bpm.toFixed(1)} BPM</span>
                <span>180 BPM</span>
              </div>
              <input
                type="range"
                min={60}
                max={180}
                step={0.5}
                value={bpm}
                onChange={(e) => setBpm(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg appearance-none"
              />
            </div>

            {/* Quantum Bar (4 Beats) */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800/80">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>ABLETON LINK QUANTUM ({quantum} BEATS)</span>
                <span className="text-cyan-400 font-bold">Beat {(beat % quantum + 1).toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((stepIdx) => {
                  const currentStep = Math.floor(beat % 4);
                  const isCurrent = currentStep === stepIdx;
                  return (
                    <div 
                      key={stepIdx} 
                      className={`h-4 rounded-md transition-all duration-75 flex items-center justify-center text-[10px] font-mono font-bold ${
                        isCurrent 
                          ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.7)]' 
                          : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {stepIdx + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dual-Tempo Toggle Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                <span>Dual-Tempo Instant Switcher (GPIO Button / Web)</span>
              </div>
              <span className="text-xs font-mono text-slate-500">1-Touch Ramping</span>
            </div>

            <p className="text-xs text-slate-400">
              Quickly jump or ramp the Link session tempo between two curated setlist grooves using a physical GPIO button on the ESP32-S3 or these web buttons.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Preset A */}
              <div className={`p-4 rounded-xl border transition-all ${
                activePreset === 'A' 
                  ? 'bg-slate-950 border-cyan-500 shadow-md shadow-cyan-950/40' 
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-cyan-400 font-bold">PRESET A</span>
                  <button
                    onClick={() => switchPreset('A')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      activePreset === 'A'
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    ACTIVATE
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={presetA}
                    onChange={(e) => setPresetA(Number(e.target.value))}
                    className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-lg font-mono font-bold text-white"
                  />
                  <span className="text-xs text-slate-500 font-mono">BPM</span>
                </div>
              </div>

              {/* Preset B */}
              <div className={`p-4 rounded-xl border transition-all ${
                activePreset === 'B' 
                  ? 'bg-slate-950 border-amber-500 shadow-md shadow-amber-950/40' 
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-amber-400 font-bold">PRESET B</span>
                  <button
                    onClick={() => switchPreset('B')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      activePreset === 'B'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    ACTIVATE
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={presetB}
                    onChange={(e) => setPresetB(Number(e.target.value))}
                    className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-lg font-mono font-bold text-white"
                  />
                  <span className="text-xs text-slate-500 font-mono">BPM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: FM-1 Hardware Button Tap Tempo (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="pb-3 border-b border-slate-800">
              <span className="text-xs font-mono text-emerald-400 font-semibold">TAP TEMPO</span>
              <h3 className="text-sm font-bold text-white">FM-1 Hardware Button & Web Tap</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Tap 3 to 4 times to lock tempo and realign the Link downbeat.
              </p>
            </div>

            {/* Big Interactive Tap Button */}
            <button
              onClick={handleTap}
              className={`w-full h-36 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all duration-75 select-none active:scale-[0.98] ${
                isTapping
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.3)]'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Zap className={`w-8 h-8 transition-colors ${isTapping ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="text-base font-bold text-white tracking-wider">TAP TEMPO</span>
              <span className="text-xs font-mono text-slate-400">
                {tapTimes.length > 0 ? `Tap ${tapTimes.length} recorded...` : 'Tap along with your beat'}
              </span>
            </button>

            {/* Tap telemetry details */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Calculated Interval:</span>
                <span className="text-cyan-400 font-bold">
                  {lastTapInterval ? `${lastTapInterval} ms` : 'Waiting for tap...'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Downbeat Phase Shift:</span>
                <span className="text-emerald-400 font-bold">Auto-aligned (Quantized)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>FM-1 MIDI Trigger:</span>
                <span className="text-slate-200">CC# 64 / Button 4 Intercept</span>
              </div>
            </div>

            {/* Explanation card */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs text-slate-400 space-y-2 leading-relaxed">
              <h4 className="font-semibold text-slate-300">How the FM-1 Hardware Tap works:</h4>
              <p>
                When you press button 4 on the M-VAVE FM-1 front panel, it transmits a USB-MIDI event to the ESP32-S3 USB Host. The firmware timestamps it with <code className="text-cyan-300">esp_timer_get_time()</code>, calculates the average delta between taps, and calls <code className="text-cyan-300">link.captureAppSessionState().setTempo()</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
