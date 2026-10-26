import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sliders, Radio, Music, Usb, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface ChannelState {
  id: string;
  name: string;
  source: string;
  usbPort: string;
  volume: number; // 0 to 1.2
  pan: number;    // -1 (Left) to +1 (Right)
  isMuted: boolean;
  isSolo: boolean;
  meterL: number;
  meterR: number;
}

export function AudioMixer() {
  const [channels, setChannels] = useState<ChannelState[]>([
    {
      id: 'ch1',
      name: 'FM-1 Alpha',
      source: 'M-VAVE FM-1 #1 (USB Audio)',
      usbPort: 'Hub Port 1',
      volume: 0.85,
      pan: -0.2,
      isMuted: false,
      isSolo: false,
      meterL: 65,
      meterR: 60,
    },
    {
      id: 'ch2',
      name: 'FM-1 Beta',
      source: 'M-VAVE FM-1 #2 (USB Audio)',
      usbPort: 'Hub Port 2',
      volume: 0.80,
      pan: 0.25,
      isMuted: false,
      isSolo: false,
      meterL: 55,
      meterR: 62,
    },
    {
      id: 'ch3',
      name: 'ESP Internal Synth',
      source: 'Felucca 6-Op FM (Core 1)',
      usbPort: 'Direct Memory',
      volume: 0.75,
      pan: 0.0,
      isMuted: false,
      isSolo: false,
      meterL: 45,
      meterR: 45,
    },
  ]);

  const [masterVolume, setMasterVolume] = useState<number>(0.9);
  const [outputRouting, setOutputRouting] = useState<'i2s' | 'usb_return'>('i2s');
  const [masterMeterL, setMasterMeterL] = useState<number>(75);
  const [masterMeterR, setMasterMeterR] = useState<number>(76);
  const [usbReturnTarget, setUsbReturnTarget] = useState<'fm1_alpha' | 'fm1_beta'>('fm1_alpha');

  // Live audio level simulation loop (simulating Core 1 audio summing)
  useEffect(() => {
    const timer = setInterval(() => {
      setChannels((prev) =>
        prev.map((ch) => {
          if (ch.isMuted) {
            return { ...ch, meterL: 0, meterR: 0 };
          }
          const base = ch.volume * 75;
          const jitterL = Math.sin(Date.now() / 200 + (ch.id === 'ch1' ? 0 : 2)) * 15;
          const jitterR = Math.cos(Date.now() / 240 + (ch.id === 'ch1' ? 1 : 3)) * 15;
          
          const panL = 1 - Math.max(0, ch.pan);
          const panR = 1 + Math.min(0, ch.pan);

          return {
            ...ch,
            meterL: Math.max(0, Math.min(95, Math.floor((base + jitterL) * panL))),
            meterR: Math.max(0, Math.min(95, Math.floor((base + jitterR) * panR))),
          };
        })
      );

      // Compute Master meters based on channel levels
      setMasterMeterL((prev) => Math.floor(Math.min(98, 70 * masterVolume + Math.random() * 10)));
      setMasterMeterR((prev) => Math.floor(Math.min(98, 72 * masterVolume + Math.random() * 8)));
    }, 80);

    return () => clearInterval(timer);
  }, [masterVolume]);

  const toggleMute = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, isMuted: !ch.isMuted } : ch))
    );
  };

  const toggleSolo = (channelId: string) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, isSolo: !ch.isSolo } : ch))
    );
  };

  const handleVolumeChange = (channelId: string, val: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, volume: val } : ch))
    );
  };

  const handlePanChange = (channelId: string, val: number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === channelId ? { ...ch, pan: val } : ch))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Headless Mixer Status & USB Hub Topology */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
              <Sliders className="w-4 h-4" />
              <span>Headless Web Mixer · Core 1 DSP Summing (44.1 kHz / 16-bit)</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Multi-FM1 USB Hub & Synth Mixer
            </h2>
            <p className="text-xs text-slate-400">
              Live touch-friendly audio mixer running directly on the ESP32-S3. No physical screen or SD card required.
            </p>
          </div>

          {/* USB Hub Topology Indicator */}
          <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <Usb className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Hub: 4-Port Active
              </span>
              <span>·</span>
              <span>FM-1 #1 (Port 1)</span>
              <span>·</span>
              <span>FM-1 #2 (Port 2)</span>
              <span>·</span>
              <span className="text-slate-500">Port 3/4 (Aux MIDI)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Console Mixer Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Channel Strips (9 cols) */}
        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {channels.map((ch) => {
            const dB = ch.isMuted
              ? '-inf'
              : (20 * Math.log10(Math.max(0.001, ch.volume))).toFixed(1);

            return (
              <div 
                key={ch.id} 
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-5"
              >
                {/* Channel Header */}
                <div className="space-y-1 pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 font-semibold">{ch.usbPort}</span>
                    <span className="text-[10px] font-mono text-slate-500">CH {ch.id.toUpperCase()}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">{ch.name}</h3>
                  <p className="text-[11px] text-slate-400 truncate">{ch.source}</p>
                </div>

                {/* Mute / Solo Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMute(ch.id)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                      ch.isMuted
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-950'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    onClick={() => toggleSolo(ch.id)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
                      ch.isSolo
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm shadow-amber-950'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    SOLO
                  </button>
                </div>

                {/* Pan Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>PAN</span>
                    <span className="text-cyan-400">
                      {ch.pan === 0 ? 'C' : ch.pan < 0 ? `L ${Math.abs(Math.round(ch.pan * 100))}%` : `R ${Math.round(ch.pan * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={ch.pan}
                    onChange={(e) => handlePanChange(ch.id, parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-950 rounded-lg appearance-none"
                  />
                </div>

                {/* Vertical Fader & Stereo VU Meters */}
                <div className="flex items-center gap-4 py-2">
                  {/* Stereo VU Meter L/R */}
                  <div className="flex gap-1.5 h-44 bg-slate-950 p-1 rounded-md border border-slate-800">
                    {/* Left meter */}
                    <div className="w-2.5 h-full bg-slate-900 rounded-sm relative overflow-hidden flex flex-col justify-end">
                      <div 
                        className={`w-full transition-all duration-75 ${
                          ch.meterL > 85 ? 'bg-rose-500' : ch.meterL > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ height: `${ch.meterL}%` }}
                      />
                    </div>
                    {/* Right meter */}
                    <div className="w-2.5 h-full bg-slate-900 rounded-sm relative overflow-hidden flex flex-col justify-end">
                      <div 
                        className={`w-full transition-all duration-75 ${
                          ch.meterR > 85 ? 'bg-rose-500' : ch.meterR > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ height: `${ch.meterR}%` }}
                      />
                    </div>
                  </div>

                  {/* Volume Slider / Fader */}
                  <div className="flex-1 flex flex-col items-center justify-between h-44 py-1">
                    <span className="text-[10px] font-mono text-slate-500">+6 dB</span>
                    <input
                      type="range"
                      min={0}
                      max={1.41}
                      step={0.01}
                      value={ch.volume}
                      onChange={(e) => handleVolumeChange(ch.id, parseFloat(e.target.value))}
                      className="h-32 accent-cyan-400 cursor-pointer -rotate-90 origin-center w-32"
                    />
                    <span className="text-[10px] font-mono text-slate-500">-inf</span>
                  </div>
                </div>

                {/* Level Readout */}
                <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-mono">
                  <span className="text-slate-500">LEVEL</span>
                  <span className="text-white font-bold tabular-nums">{dB} dB</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Master Output & Routing Strip (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-1 pb-3 border-b border-slate-800">
            <span className="text-xs font-mono text-emerald-400 font-semibold">SUM BUS</span>
            <h3 className="text-sm font-bold text-white">Master Output</h3>
            <p className="text-[11px] text-slate-400">Core 1 Summing & Soft Limiter</p>
          </div>

          {/* Audio Output Destination Routing */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400">OUTPUT ROUTING</span>
            <div className="space-y-2 text-xs">
              <button
                onClick={() => setOutputRouting('i2s')}
                className={`w-full p-2.5 rounded-lg border text-left transition-colors flex items-center justify-between ${
                  outputRouting === 'i2s'
                    ? 'bg-slate-950 border-cyan-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-200">I2S DAC (Line Out)</div>
                  <div className="text-[10px] text-slate-500 font-mono">GPIO 4/5/6 to PCM5102/ES8388</div>
                </div>
                {outputRouting === 'i2s' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => setOutputRouting('usb_return')}
                className={`w-full p-2.5 rounded-lg border text-left transition-colors flex items-center justify-between ${
                  outputRouting === 'usb_return'
                    ? 'bg-slate-950 border-cyan-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-200">USB Audio Return</div>
                  <div className="text-[10px] text-slate-500 font-mono">Send mix back to M-VAVE FM-1</div>
                </div>
                {outputRouting === 'usb_return' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* Master Stereo VU Meters & Fader */}
          <div className="flex items-center gap-4 py-2">
            {/* Master Stereo Meter */}
            <div className="flex gap-1.5 h-44 bg-slate-950 p-1.5 rounded-md border border-slate-800">
              <div className="w-3 h-full bg-slate-900 rounded-sm relative overflow-hidden flex flex-col justify-end">
                <div 
                  className={`w-full transition-all duration-75 ${
                    masterMeterL > 90 ? 'bg-rose-500' : masterMeterL > 75 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ height: `${masterMeterL}%` }}
                />
              </div>
              <div className="w-3 h-full bg-slate-900 rounded-sm relative overflow-hidden flex flex-col justify-end">
                <div 
                  className={`w-full transition-all duration-75 ${
                    masterMeterR > 90 ? 'bg-rose-500' : masterMeterR > 75 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ height: `${masterMeterR}%` }}
                />
              </div>
            </div>

            {/* Master Fader */}
            <div className="flex-1 flex flex-col items-center justify-between h-44 py-1">
              <span className="text-[10px] font-mono text-slate-500">0 dB</span>
              <input
                type="range"
                min={0}
                max={1.0}
                step={0.01}
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="h-32 accent-emerald-400 cursor-pointer -rotate-90 origin-center w-32"
              />
              <span className="text-[10px] font-mono text-slate-500">-inf</span>
            </div>
          </div>

          {/* Soft Limiter & Master Readout */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">SOFT LIMITER:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">MASTER GAIN:</span>
              <span className="text-white font-bold tabular-nums">
                {(20 * Math.log10(Math.max(0.001, masterVolume))).toFixed(1)} dB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
