import React from 'react';
import { Cpu, Terminal, Sliders, Radio, FileCode, Activity } from 'lucide-react';

export type AppTab = 'mixer' | 'tempo' | 'flasher' | 'dualcore' | 'code';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onConnectClick: () => void;
}

export function Header({ currentTab, onSelectTab, onConnectClick }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            FM1 · Link Workbench
          </span>
        </div>

        {/* Zone 2: Navigation links (single line, clean typography) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
          <button
            onClick={() => onSelectTab('mixer')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'mixer' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Web Mixer</span>
          </button>
          <button
            onClick={() => onSelectTab('tempo')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'tempo' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Link & Tap Tempo</span>
          </button>
          <button
            onClick={() => onSelectTab('flasher')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'flasher' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Web Flasher</span>
          </button>
          <button
            onClick={() => onSelectTab('dualcore')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'dualcore' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dual-Core Monitor</span>
          </button>
          <button
            onClick={() => onSelectTab('code')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'code' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Source & CI</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onConnectClick}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5" />
            Flash Device
          </button>
        </div>
      </div>
    </header>
  );
}
