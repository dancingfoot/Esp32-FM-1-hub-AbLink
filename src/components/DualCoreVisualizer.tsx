import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, Activity, Music, ShieldCheck, Flame, Volume2 } from 'lucide-react';

export function DualCoreVisualizer() {
  const [bpm, setBpm] = useState<number>(124);
  const [peers, setPeers] = useState<number>(2);
  const [engine, setEngine] = useState<'felucca' | 'melodee' | 'clipper'>('felucca');
  const [wifiBurstActive, setWifiBurstActive] = useState<boolean>(false);
  
  // Real-time animated telemetry
  const [phase, setPhase] = useState<number>(0);
  const [beat, setBeat] = useState<number>(0);
  const [core0Load, setCore0Load] = useState<number>(22);
  const [core1Load, setCore1Load] = useState<number>(48);
  const [audioBufferHealth, setAudioBufferHealth] = useState<number>(100);

  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate beat phase advance based on current BPM
      const beatsPerSecond = bpm / 60;
      const step = (beatsPerSecond * 0.05); // 50ms interval

      setBeat((prev) => (prev + step) % 16);
      setPhase((prev) => (prev + (step % 1.0)) % 1.0);

      // Core loads
      if (wifiBurstActive) {
        setCore0Load(Math.min(95, Math.floor(75 + Math.random() * 20)));
      } else {
        setCore0Load(Math.floor(18 + Math.random() * 8));
      }

      // Core 1 load depends on engine
      const baseLoad = engine === 'felucca' ? 52 : engine === 'melodee' ? 38 : 44;
      setCore1Load(Math.floor(baseLoad + Math.random() * 5));

      // Audio buffer health stays at 100% because Core 1 is isolated!
      setAudioBufferHealth(100);
    }, 50);

    return () => clearInterval(interval);
  }, [bpm, wifiBurstActive, engine]);

  const triggerWifiBurst = () => {
    setWifiBurstActive(true);
    setTimeout(() => {
      setWifiBurstActive(false);
    }, 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Activity className="w-4 h-4" />
            <span>Interactive Real-Time Isolation Demo</span>
          </div>
          <h3 className="text-base font-bold text-white mt-1">
            Core Isolation & Ableton Link Phase Synchronization
          </h3>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* BPM Slider */}
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="text-slate-500 font-mono">BPM:</span>
            <input 
              type="range" 
              min={60} 
              max={180} 
              value={bpm} 
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-400 font-bold w-9 tabular-nums">{bpm}</span>
          </div>

          {/* Engine Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-md text-xs">
            <button
              onClick={() => setEngine('felucca')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                engine === 'felucca' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Felucca FM
            </button>
            <button
              onClick={() => setEngine('melodee')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                engine === 'melodee' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Melodee
            </button>
            <button
              onClick={() => setEngine('clipper')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                engine === 'clipper' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Clipper
            </button>
          </div>

          {/* Wi-Fi Traffic Stress Button */}
          <button
            onClick={triggerWifiBurst}
            disabled={wifiBurstActive}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              wifiBurstActive
                ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            {wifiBurstActive ? 'Simulating Heavy Wi-Fi...' : 'Simulate Wi-Fi Traffic Burst'}
          </button>
        </div>
      </div>

      {/* Synchronized Beat & Phase Meter */}
      <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-lg space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Music className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">Ableton Link Quantum Bar (4 Beats)</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px] flex items-center gap-3">
            <span>Peers Connected: <strong className="text-white">{peers}</strong></span>
            <span>·</span>
            <span>Current Beat: <strong className="text-cyan-400 tabular-nums">{(beat % 4 + 1).toFixed(2)}</strong></span>
          </div>
        </div>

        {/* 4-beat visual steps */}
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((stepIdx) => {
            const currentStep = Math.floor(beat % 4);
            const isActive = currentStep === stepIdx;
            return (
              <div 
                key={stepIdx} 
                className={`h-3 rounded-md transition-all duration-75 ${
                  isActive 
                    ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]' 
                    : 'bg-slate-800/80'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Dual Core Side-by-Side Live Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core 0 Card */}
        <div className="p-5 bg-slate-950 border border-cyan-900/50 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Xtensa Core 0 (System & Wi-Fi)</h4>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold tabular-nums">
              {core0Load}% CPU
            </span>
          </div>

          {/* Load progress bar */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-150 ${
                wifiBurstActive ? 'bg-rose-500' : 'bg-cyan-400'
              }`}
              style={{ width: `${core0Load}%` }}
            />
          </div>

          <div className="space-y-1.5 text-xs text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>802.11 MAC ISRs:</span>
              <span className={wifiBurstActive ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {wifiBurstActive ? 'BURST (940 pkts/s)' : 'Nominal (60 pkts/s)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ableton Link UDP (20808):</span>
              <span className="text-slate-300">Active (~50 Hz)</span>
            </div>
            <div className="flex justify-between">
              <span>USB Host OTG Handler:</span>
              <span className="text-slate-300">Listening (1ms SOF)</span>
            </div>
          </div>
        </div>

        {/* Core 1 Card */}
        <div className="p-5 bg-slate-950 border border-amber-900/50 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Xtensa Core 1 (Audio DSP Engine)</h4>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold tabular-nums">
              {core1Load}% CPU
            </span>
          </div>

          {/* Load progress bar */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-amber-400 transition-all duration-150"
              style={{ width: `${core1Load}%` }}
            />
          </div>

          <div className="space-y-1.5 text-xs text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Active Synth Engine:</span>
              <span className="text-amber-300 font-bold capitalize">{engine} Engine</span>
            </div>
            <div className="flex justify-between">
              <span>I2S DMA Buffer Under-runs:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                0 (Zero Dropouts)
              </span>
            </div>
            <div className="flex justify-between">
              <span>DSP Chunk Time:</span>
              <span className="text-slate-300">0.72ms / 1.45ms deadline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
