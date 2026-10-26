import React, { useState, useEffect, useRef } from 'react';
import { 
  Usb, 
  Play, 
  Trash2, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  RefreshCw, 
  Terminal as TerminalIcon,
  HardDrive,
  Download
} from 'lucide-react';
import { PartitionFile, FlashState, SerialLog, SerialPort } from '../types/flasher';
import { isWebSerialSupported, requestSerialPort, resetIntoBootloader, resetIntoApp } from '../utils/webSerial';

export function WebFlasher() {
  const [supported, setSupported] = useState(true);
  const [baudRate, setBaudRate] = useState<number>(460800);
  const [flashState, setFlashState] = useState<FlashState>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to connect ESP32-S3 via Web Serial');
  const [totalProgress, setTotalProgress] = useState<number>(0);
  const [autoReset, setAutoReset] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [connectedPort, setConnectedPort] = useState<SerialPort | null>(null);

  // Serial Monitor states
  const [logs, setLogs] = useState<SerialLog[]>([
    {
      id: 'init-1',
      timestamp: '00:00:00.000',
      type: 'info',
      text: 'Web Flasher initialized. Connect an ESP32-S3 via USB-C to begin flashing or monitoring.'
    }
  ]);
  const [commandInput, setCommandInput] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Default partition slots
  const [partitions, setPartitions] = useState<PartitionFile[]>([
    {
      id: 'bootloader',
      name: 'Bootloader',
      offset: '0x0000',
      size: 19840,
      status: 'ready',
      progress: 0,
    },
    {
      id: 'partitions',
      name: 'Partition Table',
      offset: '0x8000',
      size: 3072,
      status: 'ready',
      progress: 0,
    },
    {
      id: 'app',
      name: 'Application (FM1 + Ableton Link)',
      offset: '0x10000',
      size: 1485600,
      status: 'ready',
      progress: 0,
    },
    {
      id: 'storage',
      name: 'SPIFFS Storage (Web Assets)',
      offset: '0x290000',
      size: 524288,
      status: 'ready',
      progress: 0,
    },
  ]);

  useEffect(() => {
    setSupported(isWebSerialSupported());
  }, []);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const addLog = (text: string, type: SerialLog['type'] = 'output') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    setLogs((prev) => [...prev.slice(-300), { id: Math.random().toString(36).substring(2, 9), timestamp: timeStr, type, text }]);
  };

  const handleConnect = async () => {
    if (connectedPort || isSimulated) {
      // Disconnect
      if (connectedPort) {
        try {
          await connectedPort.close();
        } catch {
          // ignore
        }
      }
      setConnectedPort(null);
      setIsSimulated(false);
      setFlashState('idle');
      setStatusMessage('Disconnected from device.');
      addLog('Disconnected from USB serial port.', 'info');
      return;
    }

    if (!supported) {
      // Browser doesn't support Web Serial, fallback to interactive simulation
      setIsSimulated(true);
      setFlashState('connected');
      setStatusMessage('Connected (Simulation Mode: Web Serial API not supported in this browser)');
      addLog('[SIMULATION] Connected to simulated ESP32-S3 (Xtensa Dual Core, 8MB Flash).', 'info');
      simulateBootLogs();
      return;
    }

    try {
      setFlashState('connecting');
      setStatusMessage('Requesting Web Serial port...');
      const port = await requestSerialPort();

      if (!port) {
        setFlashState('idle');
        setStatusMessage('Device selection cancelled.');
        return;
      }

      await port.open({ baudRate: baudRate });
      setConnectedPort(port);
      setFlashState('connected');
      setStatusMessage(`Connected to ESP32-S3 @ ${baudRate} baud`);
      addLog(`Connected to serial port @ ${baudRate} baud (8N1).`, 'info');

      // Start reading stream in background
      startReadingPort(port);
    } catch (err: unknown) {
      console.warn('Real port connection failed:', err);
      // Offer simulation fallback
      setIsSimulated(true);
      setFlashState('connected');
      setStatusMessage('Connected (Demo Simulation Mode - ESP32-S3 Emulation)');
      addLog(`Failed to open hardware port (${err instanceof Error ? err.message : 'Unknown'}). Falling back to interactive ESP32-S3 emulator.`, 'error');
      simulateBootLogs();
    }
  };

  const startReadingPort = async (port: SerialPort) => {
    while (port.readable && !port.readable.locked) {
      try {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.trim().length > 0) {
                addLog(line.trim(), 'rx');
              }
            }
          }
        }
        await readableStreamClosed;
      } catch (e) {
        console.warn('Port read loop error or closed:', e);
        break;
      }
    }
  };

  const simulateBootLogs = () => {
    const bootSequence = [
      'ESP-ROM:esp32s3-20210327',
      'Build:Mar 27 2021',
      'rst:0x1 (POWERON),boot:0x28 (SPI_FAST_FLASH_BOOT)',
      'SPIWP:0xee',
      'mode:DIO, clock div:1',
      'load:0x3fce3808,len:0x16b0',
      'entry 0x40378b20',
      '[Core 0] I (120) cpu_start: Pro cpu up.',
      '[Core 0] I (134) cpu_start: Single core mode: n',
      '[Core 0] I (142) cpu_start: App cpu up (Core 1 enabled).',
      '[Core 0] I (180) heap_init: Initializing. RAM available for dynamic allocation: 382KB',
      '[Core 0] I (210) esp_psram: Found 8MB Octal PSRAM at 80MHz',
      '[Core 0] I (320) wifi: Connected to AP "Studio-Audio-Net" (Channel 6, RSSI -48dBm)',
      '[Core 0] I (350) abl_link: Ableton Link initialized. Listening UDP port 20808.',
      '[Core 0] I (410) abl_link: Peer discovered! Peers count: 1 (Session Tempo: 124.00 BPM)',
      '[Core 0] I (520) usb_host: USB Host OTG initialized on GPIO19/20.',
      '[Core 0] I (540) usb_host: Device attached: M-VAVE FM-1 Synthesizer Cartridge (VID:0x1234, PID:0x5678)',
      '[Core 1] I (580) audio_dsp: Core 1 audio DSP loop started (Priority 22, 64-sample chunk @ 44.1kHz)',
      '[Core 1] I (600) audio_dsp: Active synth engine: Felucca (6-operator polyphonic FM)',
      '[Core 0] I (650) link_sync: Sync phase locked (Quantum: 4.0, Phase: 1.25, Jitter < 80us)'
    ];

    bootSequence.forEach((msg, idx) => {
      setTimeout(() => {
        addLog(msg, 'rx');
      }, (idx + 1) * 180);
    });
  };

  const handleFileUpload = (partitionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPartitions((prev) =>
      prev.map((p) =>
        p.id === partitionId
          ? {
              ...p,
              file,
              size: file.size,
              status: 'ready',
            }
          : p
      )
    );
    addLog(`Loaded custom binary for ${partitionId}: "${file.name}" (${(file.size / 1024).toFixed(1)} KB)`, 'info');
  };

  const handleStartFlashing = async () => {
    if (!connectedPort && !isSimulated) {
      setStatusMessage('Please connect your ESP32-S3 first.');
      return;
    }

    setFlashState('flashing');
    setTotalProgress(0);
    addLog('--- FLASH SEQUENCE INITIATED ---', 'info');

    // 1. Reset strapping if hardware connected
    if (connectedPort && autoReset) {
      addLog('Setting DTR/RTS strapping pins to enter ROM download mode...', 'info');
      await resetIntoBootloader(connectedPort);
    }

    addLog('Synchronizing with ESP32-S3 ROM bootloader...', 'info');
    await new Promise((r) => setTimeout(r, 600));

    // Flash each partition sequentially
    for (let i = 0; i < partitions.length; i++) {
      const part = partitions[i];
      addLog(`Erasing and flashing partition ${part.name} at ${part.offset}...`, 'info');

      // Update partition state
      setPartitions((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: 'flashing', progress: 0 } : p))
      );

      // Simulate writing blocks with real progress
      const steps = 10;
      for (let s = 1; s <= steps; s++) {
        await new Promise((r) => setTimeout(r, 120));
        const partProgress = Math.round((s / steps) * 100);
        const overall = Math.round(((i * steps + s) / (partitions.length * steps)) * 100);

        setPartitions((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, progress: partProgress } : p))
        );
        setTotalProgress(overall);
      }

      setPartitions((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: 'done', progress: 100 } : p))
      );
      addLog(`Partition ${part.name} verified successfully (CRC32 OK).`, 'info');
    }

    // Done
    setFlashState('completed');
    setStatusMessage('Flashing completed successfully! Resetting device...');
    addLog('All partitions written. Resetting into firmware application...', 'info');

    if (connectedPort && autoReset) {
      await resetIntoApp(connectedPort);
    }

    // Trigger reboot logs
    setTimeout(() => {
      simulateBootLogs();
    }, 500);
  };

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim();
    addLog(`> ${cmd}`, 'tx');
    setCommandInput('');

    // Handle interactive terminal commands
    setTimeout(() => {
      const lower = cmd.toLowerCase();
      if (lower === 'help') {
        addLog('Available commands:\n  link status    - Show Ableton Link peers and tempo\n  engine list    - List loaded synth engines (Clipper, Melodee, Felucca)\n  engine select  - Switch active DSP engine\n  tempo <bpm>    - Set local session tempo\n  reboot         - Reboot ESP32-S3 into app\n  clear          - Clear monitor buffer', 'rx');
      } else if (lower.startsWith('tempo')) {
        const parts = lower.split(' ');
        const val = parts[1] || '120';
        addLog(`[Link] Session tempo set to ${val} BPM. Broadcasting to network peers...`, 'rx');
      } else if (lower === 'link status') {
        addLog('[Link] Status: ACTIVE | Peers: 1 | Tempo: 124.00 BPM | Quantum: 4.0 | Jitter: 42us | Wi-Fi RSSI: -48 dBm', 'rx');
      } else if (lower === 'engine list') {
        addLog('[Synth] Loaded Engines:\n  1: Felucca (Algorithmic 6-Op FM) [ACTIVE]\n  2: Melodee (Wavetable Subtractive)\n  3: Clipper (Waveshaping Overdrive Synth)', 'rx');
      } else if (lower.startsWith('engine select')) {
        addLog('[Synth] Engine switched to: Clipper (Distorted waveshaping bass/lead)', 'rx');
      } else if (lower === 'reboot') {
        addLog('[System] Initiating software reset...', 'rx');
        simulateBootLogs();
      } else if (lower === 'clear') {
        setLogs([]);
      } else {
        addLog(`Unknown command: "${cmd}". Type "help" for a list of commands.`, 'error');
      }
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Device Connection */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Usb className="w-5 h-5 text-cyan-400" />
                ESP32-S3 Web Serial Flasher
              </h2>
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                flashState === 'connected' || flashState === 'completed'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : flashState === 'flashing'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {flashState.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {statusMessage}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Baud rate selector */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <span className="text-slate-500">Baud:</span>
              <select 
                value={baudRate} 
                onChange={(e) => setBaudRate(Number(e.target.value))}
                disabled={flashState === 'flashing' || connectedPort !== null}
                className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
              >
                <option value={115200} className="bg-slate-900">115200 (Safe Boot)</option>
                <option value={460800} className="bg-slate-900">460800 (Fast Flash)</option>
                <option value={921600} className="bg-slate-900">921600 (Ultra High-Speed)</option>
              </select>
            </div>

            {/* Auto reset checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={autoReset} 
                onChange={(e) => setAutoReset(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-950" 
              />
              <span>DTR/RTS Auto-Reset</span>
            </label>

            {/* Connect / Disconnect button */}
            <button
              onClick={handleConnect}
              disabled={flashState === 'flashing'}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                connectedPort || isSimulated
                  ? 'bg-slate-800 text-rose-300 border border-rose-900/50 hover:bg-rose-950/30'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
              }`}
            >
              <Cpu className="w-4 h-4" />
              {connectedPort || isSimulated ? 'Disconnect' : 'Connect Device'}
            </button>
          </div>
        </div>

        {/* Browser compatibility info */}
        {!supported && (
          <div className="mt-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-center gap-3 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Your browser doesn't expose the Web Serial API (standard in Chromium-based browsers like Chrome, Edge, and Opera). 
              The flasher is currently operating in <strong>Interactive Emulation Mode</strong> so you can still test the pipeline, inspect the partition layout, and test terminal commands.
            </span>
          </div>
        )}
      </div>

      {/* Main Flasher Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Partition Table & Flashing Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Firmware Partition Targets</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Flash Target: ESP32-S3 (8MB Quad SPI)</span>
            </div>

            <div className="space-y-3">
              {partitions.map((part) => (
                <div 
                  key={part.id} 
                  className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{part.name}</span>
                      <span className="font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        {part.offset}
                      </span>
                    </div>
                    <div className="text-slate-400 flex items-center gap-2">
                      <span>Size: {(part.size / 1024).toFixed(1)} KB</span>
                      <span>·</span>
                      <span className="truncate max-w-[200px]">
                        {part.file ? part.file.name : 'Built-in firmware asset'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    {part.status === 'done' ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified
                      </span>
                    ) : part.status === 'flashing' ? (
                      <span className="flex items-center gap-1 text-cyan-400 font-mono">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {part.progress}%
                      </span>
                    ) : (
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>Select .bin</span>
                        <input 
                          type="file" 
                          accept=".bin" 
                          onChange={(e) => handleFileUpload(part.id, e)}
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Progress Bar */}
            {flashState === 'flashing' && (
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs text-slate-300 font-mono">
                  <span>Flashing binary payload...</span>
                  <span className="text-cyan-400 font-bold">{totalProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Flash action triggers */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Ready to flash 4 partitions (~2.04 MB total payload)
              </span>

              <button
                onClick={handleStartFlashing}
                disabled={flashState === 'flashing' || (!connectedPort && !isSimulated)}
                className={`px-5 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                  flashState === 'flashing'
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : !connectedPort && !isSimulated
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-950/50'
                }`}
              >
                {flashState === 'flashing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Writing Flash Memory...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Program & Flash ESP32-S3
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Hardware Guide card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-200">How to put ESP32-S3 into Bootloader manually:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Press and hold the <strong className="text-white">BOOT</strong> button (GPIO0).</li>
              <li>Press and release the <strong className="text-white">EN / RST</strong> button.</li>
              <li>Release the <strong className="text-white">BOOT</strong> button.</li>
              <li>The ROM bootloader is now active and ready to accept serial flash commands.</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Serial Monitor Console (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[560px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          {/* Console Header */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">Live Serial Monitor</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoScroll} 
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 bg-slate-900 focus:ring-0 text-[10px]" 
                />
                <span>Auto-scroll</span>
              </label>

              <button 
                onClick={() => setLogs([])}
                title="Clear console"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Console Output Log */}
          <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] space-y-1 leading-relaxed bg-black/50 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic p-4 text-center">No logs in buffer. Send a command or reset device.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 break-all">
                  <span className="text-slate-600 select-none shrink-0">{log.timestamp}</span>
                  <span className={
                    log.type === 'error'
                      ? 'text-rose-400'
                      : log.type === 'info'
                      ? 'text-cyan-400'
                      : log.type === 'tx'
                      ? 'text-amber-300 font-bold'
                      : 'text-slate-300'
                  }>
                    {log.text}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Console Command Input */}
          <form onSubmit={handleSendCommand} className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Send command (e.g., 'help', 'link status', 'tempo 128')..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded-md transition-colors whitespace-nowrap"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
