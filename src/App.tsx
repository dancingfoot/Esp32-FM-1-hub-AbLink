import React, { useState } from 'react';
import { Header, AppTab } from './components/Header';
import { AudioMixer } from './components/AudioMixer';
import { TempoController } from './components/TempoController';
import { WebFlasher } from './components/WebFlasher';
import { ArchitectureView } from './components/ArchitectureView';
import { DualCoreVisualizer } from './components/DualCoreVisualizer';
import { CodeGenerator } from './components/CodeGenerator';
import { Cpu, ArrowUpRight, Sliders, Radio, Terminal, Activity, FileCode } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('mixer');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3-Zone Top Navigation Bar */}
      <Header 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        onConnectClick={() => setCurrentTab('flasher')} 
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Context strip with clean metadata */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Headless ESP32-S3</span>
              <span aria-hidden="true">·</span>
              <span>4-Port USB Hub Host</span>
              <span aria-hidden="true">·</span>
              <span>Ableton Link Wi-Fi (ETH01 Ready)</span>
              <span aria-hidden="true">·</span>
              <span>Core 1 DSP Mixer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              FM1 Multi-Synthesizer & Ableton Link Hub
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Web control console, real-time audio mixer, and USB flasher for multi-device M-VAVE FM-1 setups synced wirelessly over Ableton Link.
            </p>
          </div>

          {/* Quick Segmented Tab Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setCurrentTab('mixer')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'mixer'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Web Mixer</span>
            </button>
            <button
              onClick={() => setCurrentTab('tempo')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'tempo'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Link & Tap Tempo</span>
            </button>
            <button
              onClick={() => setCurrentTab('flasher')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'flasher'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Web Flasher</span>
            </button>
            <button
              onClick={() => setCurrentTab('dualcore')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'dualcore'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dual-Core Monitor</span>
            </button>
            <button
              onClick={() => setCurrentTab('code')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentTab === 'code'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Source & CI</span>
            </button>
          </div>
        </div>

        {/* Tab Viewport */}
        {currentTab === 'mixer' && <AudioMixer />}
        {currentTab === 'tempo' && <TempoController />}
        {currentTab === 'flasher' && <WebFlasher />}
        {currentTab === 'dualcore' && (
          <div className="space-y-6">
            <DualCoreVisualizer />
            <ArchitectureView />
          </div>
        )}
        {currentTab === 'code' && <CodeGenerator />}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>ESP32-S3 Headless Hardware Synthesizer & Audio Mixer Hub</span>
            <span>·</span>
            <span>ESP-IDF v5.3</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button 
              onClick={() => setCurrentTab('mixer')} 
              className="hover:text-cyan-400 transition-colors"
            >
              Live Mixer
            </button>
            <button 
              onClick={() => setCurrentTab('tempo')} 
              className="hover:text-cyan-400 transition-colors"
            >
              Transport & Tap
            </button>
            <button 
              onClick={() => setCurrentTab('flasher')} 
              className="hover:text-cyan-400 transition-colors"
            >
              Web Flasher
            </button>
            <button 
              onClick={() => setCurrentTab('code')} 
              className="hover:text-cyan-400 transition-colors"
            >
              Export Firmware Code
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
