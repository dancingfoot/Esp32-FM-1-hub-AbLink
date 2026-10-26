export interface SerialPort {
  readable: ReadableStream<Uint8Array | BufferSource | any> | null;
  writable: WritableStream<Uint8Array | BufferSource | any> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  setSignals(signals: { dataTerminalReady?: boolean; requestToSend?: boolean; break?: boolean }): Promise<void>;
  getSignals?(): Promise<{ dataCarrierDetect: boolean; clearToSend: boolean; ringIndicator: boolean; dataSetReady: boolean }>;
}

export interface PartitionFile {
  id: string;
  name: string;
  offset: string;
  size: number;
  file?: File;
  data?: Uint8Array;
  status: 'idle' | 'ready' | 'flashing' | 'done' | 'error';
  progress: number;
}

export type FlashState = 'idle' | 'connecting' | 'connected' | 'erasing' | 'flashing' | 'verifying' | 'completed' | 'error';

export interface SerialLog {
  id: string;
  timestamp: string;
  type: 'info' | 'output' | 'error' | 'rx' | 'tx';
  text: string;
}

export interface DualCoreTask {
  name: string;
  core: 0 | 1;
  priority: number;
  stackSize: string;
  period: string;
  description: string;
  role: 'system' | 'audio' | 'sync' | 'usb';
}
