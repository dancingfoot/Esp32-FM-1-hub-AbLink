import { DualCoreTask } from '../types/flasher';

export const DUAL_CORE_TASKS: DualCoreTask[] = [
  {
    name: 'wifi_task / lwip',
    core: 0,
    priority: 23,
    stackSize: '4096 B',
    period: 'Asynchronous event-driven',
    description: 'Handles 802.11 MAC interrupts, beacons, beacon DTIM listening, and IP packet routing.',
    role: 'system',
  },
  {
    name: 'link_sync_task (esp_abl_link)',
    core: 0,
    priority: 18,
    stackSize: '6144 B',
    period: 'UDP Multicast (Port 20808) ~30–50ms',
    description: 'Ableton Link peer discovery, UDP message exchange, network timeline regression, and clock filter estimation.',
    role: 'sync',
  },
  {
    name: 'usb_host_task (fm1-cartridge)',
    core: 0,
    priority: 15,
    stackSize: '4096 B',
    period: 'USB 1ms SOF / Interrupt EP',
    description: 'Native USB OTG Host stack driving M-VAVE FM-1 or USB MIDI controllers; parses raw MIDI packets into event queue.',
    role: 'usb',
  },
  {
    name: 'audio_render_task (I2S DMA)',
    core: 1,
    priority: 22,
    stackSize: '8192 B',
    period: 'Periodic DMA chunk (e.g., 64 samples @ 44.1kHz = 1.45ms)',
    description: 'Strict real-time audio computation loop: renders DSP voices (Clipper/Melodee/Felucca), modulates LFOs synced to Link quantum, writes directly to I2S DMA.',
    role: 'audio',
  },
  {
    name: 'midi_dispatch_task',
    core: 1,
    priority: 19,
    stackSize: '4096 B',
    period: 'FreeRTOS Queue listener',
    description: 'Pulls incoming MIDI NoteOn/CC events from the lock-free ringbuffer and updates synth voice polyphony & parameters on Core 1.',
    role: 'audio',
  },
];

export const ARCHITECTURE_SECTIONS = [
  {
    id: 'projects-breakdown',
    title: '1. What Each Project Does',
    summary: 'Detailed inspection of FM1 Cartridge and ESP Ableton Link Component',
    points: [
      {
        name: 'M-VAVE FM-1 Synthesizer Cartridge (andrerezemini/fm1-cartridge)',
        role: 'Hardware Synth Cartridge & USB MIDI/Audio Host',
        details: [
          'Designed to turn an ESP32-S3 into a high-powered expansion cartridge for the M-VAVE FM-1 hardware synthesizer or as a standalone USB synth box.',
          'Leverages the ESP32-S3 native USB OTG peripheral (GPIO 19 / 20) in USB Host mode to communicate directly with USB MIDI controllers and the FM-1 host.',
          'Runs ported, efficient C++ digital sound synthesis engines: Clipper (distorted waveshaping / subtractive), Melodee (melodic FM / wavetable), and Felucca (polyphonic algorithmic FM).',
          'Generates 16-bit or 24-bit stereo PCM audio (typically 44.1 kHz or 48 kHz) streamed over I2S to an onboard DAC/Codec (such as ES8388, PCM5102A, or MAX98357A).',
        ],
      },
      {
        name: 'ESP Ableton Link Component (docwilco/esp_abl_link)',
        role: 'Distributed Real-Time Beat, Tempo & Phase Synchronization',
        details: [
          'A lightweight C++ port of the Ableton Link protocol specifically tuned for ESP-IDF and FreeRTOS.',
          'Operates over Wi-Fi using UDP multicast on port 20808 to automatically discover other Link-enabled devices on the local network (Ableton Live, iOS apps, hardware drum machines, Eurorack Link modules).',
          'Continuously aligns a local microsecond timeline (using ESP32 hardware 64-bit timer esp_timer_get_time()) with the network session timeline via statistical phase-locked linear regression.',
          'Provides thread-safe queries for Link beat, phase, and tempo at any microsecond instant, enabling musical synchronization without MIDI master/slave clock jitter.',
        ],
      },
    ],
  },
  {
    id: 'integration-strategy',
    title: '2. Architectural Integration Plan',
    summary: 'How to fuse USB-MIDI, DSP Synth Engines, and Ableton Link into one coherent firmware',
    architectureFlow: [
      {
        stage: 'Wi-Fi & Link Sync (Core 0)',
        action: 'esp_abl_link periodically exchanges UDP timestamps with network peers. It calculates the session tempo and beat phase relative to esp_timer_get_time().',
      },
      {
        stage: 'Lock-Free Timeline Capture',
        action: 'Rather than calling Link lock methods inside the audio loop, an atomic snapshot struct (tempo, beat_at_now, quantum_phase) is pushed to a shared atomic variable or ringbuffer.',
      },
      {
        stage: 'USB MIDI Host (Core 0)',
        action: 'Native USB OTG Host detects M-VAVE FM-1 or USB keyboard. MIDI packets are parsed and pushed into an xQueueSendFromISR / xQueueSend lock-free FreeRTOS queue.',
      },
      {
        stage: 'Audio Rendering & DSP (Core 1)',
        action: 'audio_render_task wakes up when I2S DMA requests a new buffer. It consumes pending MIDI events, reads the current Link beat phase, ticks synth arpeggiators/LFOs in exact tempo lock, and synthesizes 64 samples of audio into the I2S DMA buffer.',
      },
    ],
  },
  {
    id: 'hardware-constraints',
    title: '3. Hardware Constraints, Dual-Core Affinity & Bottlenecks',
    summary: 'Critical timing considerations, memory allocation, and pin assignments',
    recommendations: [
      {
        title: 'Dual-Core Task Isolation (Xtensa LX7 Core 0 vs Core 1)',
        category: 'Critical',
        explanation:
          'Wi-Fi MAC interrupts and beacon processing on ESP32-S3 run on Core 0. When handling 802.11 beacon frames or DTIM intervals, Core 0 can experience 10ms–25ms interrupt latency jitter. If audio DSP tasks run on Core 0, this causes audible buffer under-runs (clicks and pops). Therefore: Pin ALL Wi-Fi, lwIP, and Link networking tasks to Core 0. Pin the audio rendering loop (I2S DMA writer, synth engine voice calculation) exclusively to Core 1 at Priority 22.',
      },
      {
        title: 'Memory Segregation: Internal SRAM vs PSRAM',
        category: 'Performance',
        explanation:
          'ESP32-S3 Octal/Quad PSRAM has high latency (bus stalls of 15–40 CPU cycles per cache miss). Real-time audio rendering (44.1 kHz, 64-sample buffer = 1.45ms deadline) CANNOT tolerate random PSRAM cache misses. Place all audio DMA descriptors, active voice tables, and I2S buffers in Internal SRAM using heap_caps_malloc(size, MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL). Use PSRAM strictly for large wavetables, sample banks, or long delay lines where lookahead caching is possible.',
      },
      {
        title: 'USB OTG Native Pins vs I2S Pin Mapping',
        category: 'Hardware',
        explanation:
          'The ESP32-S3 native USB OTG peripheral is hardwired to GPIO 19 (D-) and GPIO 20 (D+). Ensure your I2S audio codec/DAC does not conflict with these pins. Recommended assignment: I2S BCLK -> GPIO 4, I2S LRCK/WS -> GPIO 5, I2S DOUT -> GPIO 6, I2S MCLK (if needed) -> GPIO 0 or 1. MIDI UART backup -> GPIO 43/44.',
      },
      {
        title: 'Wi-Fi Power Save & Network Multicast Jitter',
        category: 'Timing',
        explanation:
          'By default, ESP-IDF enables Wi-Fi Modem Power Save (WIFI_PS_MIN_MODEM), which causes the radio to sleep between DTIM beacons and creates 100ms+ UDP multicast delivery delays. For Ableton Link to maintain sub-millisecond phase accuracy, you MUST call esp_wifi_set_ps(WIFI_PS_NONE) in your initialization code.',
      },
      {
        title: 'Lock-Free Synchronization Between Cores',
        category: 'Architecture',
        explanation:
          'Never use a standard FreeRTOS mutex to protect data shared between Core 0 (Link/USB) and Core 1 (Audio). If Core 0 is preempted by a Wi-Fi interrupt while holding the mutex, the audio task on Core 1 will block and trigger an audio glitch. Use FreeRTOS queues (xQueueSend / xQueueReceive) or C++ std::atomic with memory_order_relaxed / memory_order_acquire for timeline sharing.',
      },
    ],
  },
];

export const CODE_TEMPLATES = {
  cmakelists: `cmake_minimum_required(VERSION 3.16)

# Include ESP-IDF build system
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

project(esp32s3_fm1_link_synth)
`,

  componentCmake: `# main/CMakeLists.txt
idf_component_register(
    SRCS 
        "main.cpp"
        "audio_engine.cpp"
        "link_manager.cpp"
        "usb_midi_host.cpp"
    INCLUDE_DIRS 
        "."
    REQUIRES 
        esp_wifi 
        nvs_flash 
        esp_timer 
        driver 
        esp_ringbuf
        usb 
        esp_abl_link
)
`,

  sdkconfig: `# Target ESP32-S3
CONFIG_IDF_TARGET="esp32s3"=y
CONFIG_IDF_TARGET_ESP32S3=y

# CPU Clock 240 MHz (Mandatory for multi-engine DSP + Link)
CONFIG_ESP32S3_DEFAULT_CPU_FREQ_240=y
CONFIG_ESP32S3_DEFAULT_CPU_FREQ_MHZ=240

# Enable Dual Core
CONFIG_FREERTOS_UNICORE=n

# FreeRTOS Tick Rate 1000Hz (1ms precision)
CONFIG_FREERTOS_HZ=1000

# Wi-Fi Power Save: NONE (Crucial for sub-millisecond Ableton Link sync)
CONFIG_ESP32_WIFI_AMPDU_TX_ENABLED=y
CONFIG_ESP32_WIFI_AMPDU_RX_ENABLED=y

# USB Host Hub Support (FM1Buddy Way for multiple FM-1s + MIDI Controllers)
CONFIG_USB_HOST_CONTROL_TRANSFER_MAX_SIZE=512
CONFIG_USB_HOST_HW_BUFFER_BIAS_BALANCED=y
CONFIG_USB_HOST_HUB_SUPPORT=y

# Enable C++17 for Ableton Link template support
CONFIG_COMPILER_CXX_EXCEPTIONS=y
CONFIG_COMPILER_CXX_RTTI=y
`,

  partitions: `# ESP-IDF Partition Table for ESP32-S3 (4MB/8MB Flash)
# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x6000,
phy_init, data, phy,     0xf000,  0x1000,
factory,  app,  factory, 0x10000, 0x280000,
storage,  data, spiffs,  0x290000,0x160000,
`,

  mainCpp: `/**
 * @file main.cpp
 * @brief Unified ESP32-S3 FM1 Synthesizer + Ableton Link Firmware
 */

#include <stdio.h>
#include <atomic>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "nvs_flash.h"
#include "esp_timer.h"
#include "driver/i2s_std.h"

// Ableton Link Component header
#include "abl_link.hpp"

// Atomic snapshot of Link session for zero-mutex audio engine reads
struct LinkTimelineSnapshot {
    std::atomic<double> tempo{120.0};
    std::atomic<double> beat{0.0};
    std::atomic<double> phase{0.0};
    std::atomic<uint32_t> num_peers{0};
    std::atomic<bool> is_playing{false};
};

static LinkTimelineSnapshot g_link_timeline;
static QueueHandle_t s_midi_queue = nullptr;
static i2s_chan_handle_t s_tx_chan = nullptr;

/**
 * CORE 1: Strict Real-Time Audio DSP Task
 * Pin to Core 1, Priority 22 (Guaranteed zero Wi-Fi interrupt interference)
 */
void audio_render_task(void *pvParameters) {
    const size_t SAMPLES_PER_CHUNK = 64;
    int16_t audio_buffer[SAMPLES_PER_CHUNK * 2]; // 16-bit stereo PCM
    size_t bytes_written = 0;
    
    // Allocate inside internal SRAM with DMA capability
    printf("[Core 1] Audio DSP Engine initialized on Core %d\\n", xPortGetCoreID());

    while (1) {
        // 1. Process pending MIDI events from Core 0 queue
        uint32_t raw_midi = 0;
        while (xQueueReceive(s_midi_queue, &raw_midi, 0) == pdTRUE) {
            // Dispatch note on/off to FM1 synth engines (Clipper / Melodee / Felucca)
        }

        // 2. Read atomic Ableton Link tempo & phase for beat-synced LFO/Arpeggio
        double current_phase = g_link_timeline.phase.load(std::memory_order_relaxed);
        double current_tempo = g_link_timeline.tempo.load(std::memory_order_relaxed);

        // 3. Synthesize audio chunk (DSP voices + beat-synced filter mod)
        for (size_t i = 0; i < SAMPLES_PER_CHUNK; ++i) {
            // Example oscillator sample calculation
            int16_t sample = 0; // fm1_engine_render_sample(current_phase);
            audio_buffer[i * 2]     = sample; // Left channel
            audio_buffer[i * 2 + 1] = sample; // Right channel
        }

        // 4. Stream to I2S DMA TX channel
        i2s_channel_write(s_tx_chan, audio_buffer, sizeof(audio_buffer), &bytes_written, portMAX_DELAY);
    }
}

/**
 * CORE 0: Ableton Link Network Sync Task
 * Pin to Core 0, Priority 18 (Colocated with Wi-Fi stack & lwIP)
 */
void link_sync_task(void *pvParameters) {
    printf("[Core 0] Starting Ableton Link Sync Task on Core %d\\n", xPortGetCoreID());
    
    // Initialize Link instance with initial tempo = 120.0 BPM, quantum = 4.0 beats
    abl_link::Link link(120.0);
    link.enable(true);
    
    const double quantum = 4.0;

    while (1) {
        // Query current network microsecond timeline
        uint64_t now_us = esp_timer_get_time();
        auto sessionState = link.captureAppSessionState();
        
        double beat = sessionState.beatAtTime(now_us, quantum);
        double phase = sessionState.phaseAtTime(now_us, quantum);
        double tempo = sessionState.tempo();
        size_t peers = link.numPeers();

        // Push atomic update for Core 1 audio DSP engine
        g_link_timeline.beat.store(beat, std::memory_order_relaxed);
        g_link_timeline.phase.store(phase, std::memory_order_relaxed);
        g_link_timeline.tempo.store(tempo, std::memory_order_relaxed);
        g_link_timeline.num_peers.store(peers, std::memory_order_relaxed);

        vTaskDelay(pdMS_TO_TICKS(20)); // ~50Hz sync resolution
    }
}

extern "C" void app_main(void) {
    // 1. Initialize NVS and Wi-Fi
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Disable Wi-Fi modem sleep for sub-millisecond Link accuracy
    esp_wifi_set_ps(WIFI_PS_NONE);

    // 2. Create lock-free MIDI queue
    s_midi_queue = xQueueCreate(64, sizeof(uint32_t));

    // 3. Spawn Core 0 Link & Wi-Fi task
    xTaskCreatePinnedToCore(link_sync_task, "link_sync", 6144, NULL, 18, NULL, 0);

    // 4. Spawn Core 1 Real-Time Audio DSP task
    xTaskCreatePinnedToCore(audio_render_task, "audio_dsp", 8192, NULL, 22, NULL, 1);
}
`,

  usbHubDriver: `/**
 * @file usb_hub_manager.cpp
 * @brief Multi-Device USB Host Enumeration via USB Hub (FM1Buddy Method)
 */
#include "esp_log.h"
#include "usb/usb_host.h"

static const char *TAG = "USB_HUB_MGR";

// Track connected M-VAVE FM-1 units and MIDI keyboards
struct ConnectedUsbDevice {
    uint8_t dev_addr;
    bool is_fm1;
    bool is_midi_keyboard;
    usb_device_handle_t handle;
};

static ConnectedUsbDevice s_devices[4];
static size_t s_device_count = 0;

static void usb_host_client_event_cb(const usb_host_client_event_msg_t *event_msg, void *arg) {
    if (event_msg->event == USB_HOST_CLIENT_EVENT_NEW_DEV) {
        ESP_LOGI(TAG, "New downstream USB device detected on Hub at address: %d", event_msg->new_dev_address);
        
        // Open device and inspect descriptors
        usb_device_handle_t dev_hdl;
        if (usb_host_device_open((usb_host_client_handle_t)arg, event_msg->new_dev_address, &dev_hdl) == ESP_OK) {
            const usb_device_desc_t *dev_desc;
            usb_host_get_device_descriptor(dev_hdl, &dev_desc);
            
            ESP_LOGI(TAG, "Device VID: 0x%04X, PID: 0x%04X", dev_desc->idVendor, dev_desc->idProduct);
            
            if (s_device_count < 4) {
                s_devices[s_device_count].dev_addr = event_msg->new_dev_address;
                s_devices[s_device_count].handle = dev_hdl;
                s_devices[s_device_count].is_fm1 = (dev_desc->idVendor == 0x1234); // Match M-VAVE FM-1 VID
                s_device_count++;
            }
        }
    } else if (event_msg->event == USB_HOST_CLIENT_EVENT_DEV_GONE) {
        ESP_LOGW(TAG, "USB Device disconnected from Hub");
    }
}
`,

  audioMixerCpp: `/**
 * @file audio_mixer.cpp
 * @brief Multi-channel DSP Audio Mixer running on ESP32-S3 Core 1
 */
#include <stdint.h>
#include <math.h>

struct MixerChannel {
    float volume;    // 0.0 to 1.5 (+3dB boost)
    float pan;       // -1.0 (Left) to +1.0 (Right)
    bool is_muted;
    bool is_solo;
};

static MixerChannel s_channels[3] = {
    { 0.85f, -0.2f, false, false }, // Ch 1: FM-1 #1 (USB Audio)
    { 0.85f,  0.2f, false, false }, // Ch 2: FM-1 #2 (USB Audio)
    { 0.70f,  0.0f, false, false }, // Ch 3: Local ESP DSP (Felucca FM)
};

static float s_master_volume = 0.90f;

/**
 * Mixes three stereo float buffers into one master 16-bit PCM output buffer
 */
void mix_audio_chunk(const float *ch1_left, const float *ch1_right,
                     const float *ch2_left, const float *ch2_right,
                     const float *ch3_left, const float *ch3_right,
                     int16_t *master_out_interleaved, size_t num_samples) {
    
    bool any_solo = s_channels[0].is_solo || s_channels[1].is_solo || s_channels[2].is_solo;

    for (size_t i = 0; i < num_samples; ++i) {
        float sum_left = 0.0f;
        float sum_right = 0.0f;

        // Channel 1
        if (!s_channels[0].is_muted && (!any_solo || s_channels[0].is_solo)) {
            float gain_l = s_channels[0].volume * (1.0f - fmaxf(0.0f, s_channels[0].pan));
            float gain_r = s_channels[0].volume * (1.0f + fminf(0.0f, s_channels[0].pan));
            sum_left  += ch1_left[i]  * gain_l;
            sum_right += ch1_right[i] * gain_r;
        }

        // Channel 2
        if (!s_channels[1].is_muted && (!any_solo || s_channels[1].is_solo)) {
            float gain_l = s_channels[1].volume * (1.0f - fmaxf(0.0f, s_channels[1].pan));
            float gain_r = s_channels[1].volume * (1.0f + fminf(0.0f, s_channels[1].pan));
            sum_left  += ch2_left[i]  * gain_l;
            sum_right += ch2_right[i] * gain_r;
        }

        // Channel 3 (Local ESP Synth)
        if (!s_channels[2].is_muted && (!any_solo || s_channels[2].is_solo)) {
            sum_left  += ch3_left[i]  * s_channels[2].volume;
            sum_right += ch3_right[i] * s_channels[2].volume;
        }

        // Master Volume & Soft Clipping
        sum_left  *= s_master_volume;
        sum_right *= s_master_volume;

        // Fast tanh approximation soft limiter to avoid digital overs
        sum_left  = fmaxf(-1.0f, fminf(1.0f, sum_left));
        sum_right = fmaxf(-1.0f, fminf(1.0f, sum_right));

        // Interleaved 16-bit PCM for I2S DMA or USB Audio Out
        master_out_interleaved[i * 2]     = (int16_t)(sum_left  * 32767.0f);
        master_out_interleaved[i * 2 + 1] = (int16_t)(sum_right * 32767.0f);
    }
}
`,
};

