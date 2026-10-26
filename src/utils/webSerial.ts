/**
 * Web Serial API manager for ESP32-S3 Flasher and Serial Monitor
 */
import { SerialPort } from '../types/flasher';

export interface SerialPortWrapper {
  port: SerialPort | null;
  reader: ReadableStreamDefaultReader<Uint8Array> | null;
  writer: WritableStreamDefaultWriter<Uint8Array> | null;
  isConnected: boolean;
  isSimulated: boolean;
}

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export async function requestSerialPort(): Promise<SerialPort | null> {
  if (!isWebSerialSupported()) {
    throw new Error('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
  }

  try {
    // Request port, optionally filtering by Espressif USB vendor IDs: 0x303A (Espressif native USB S3/C3), 0x10C4 (CP2102), 0x1A86 (CH340), 0x0403 (FTDI)
    const port = await (navigator as unknown as { serial: { requestPort: (opts?: unknown) => Promise<SerialPort> } }).serial.requestPort({
      filters: [
        { usbVendorId: 0x303a }, // Espressif native USB-JTAG/Serial or OTG
        { usbVendorId: 0x10c4 }, // Silicon Labs CP210x
        { usbVendorId: 0x1a86 }, // WCH CH340 / CH9102
        { usbVendorId: 0x0403 }, // FTDI
      ]
    });
    return port;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NotFoundError') {
      return null; // User cancelled port selection
    }
    throw err;
  }
}

/**
 * Resets ESP32-S3 into ROM Bootloader mode using RTS/DTR strapping pins
 * RTS = EN (Reset), DTR = GPIO0 (Boot)
 */
export async function resetIntoBootloader(port: SerialPort): Promise<void> {
  try {
    // 1. Pull GPIO0 Low (DTR=true) while EN High (RTS=false)
    await port.setSignals({ dataTerminalReady: true, requestToSend: false });
    await new Promise((r) => setTimeout(r, 100));

    // 2. Pull EN Low (RTS=true) to reset chip
    await port.setSignals({ dataTerminalReady: true, requestToSend: true });
    await new Promise((r) => setTimeout(r, 250));

    // 3. Release EN (RTS=false) while GPIO0 is still Low
    await port.setSignals({ dataTerminalReady: true, requestToSend: false });
    await new Promise((r) => setTimeout(r, 150));

    // 4. Release GPIO0 (DTR=false)
    await port.setSignals({ dataTerminalReady: false, requestToSend: false });
    await new Promise((r) => setTimeout(r, 50));
  } catch (e) {
    console.warn('Hardware strapping control via signals failed or unneeded:', e);
  }
}

/**
 * Resets ESP32-S3 back into normal run mode
 */
export async function resetIntoApp(port: SerialPort): Promise<void> {
  try {
    // Pull EN low then high with GPIO0 high
    await port.setSignals({ dataTerminalReady: false, requestToSend: true });
    await new Promise((r) => setTimeout(r, 200));
    await port.setSignals({ dataTerminalReady: false, requestToSend: false });
  } catch (e) {
    console.warn('Reset signal failed:', e);
  }
}
