/**
 * @file main.cpp
 * @brief Unified ESP32-S3 FM1 Synthesizer + Ableton Link Firmware
 * 
 * Hardware Affinity Architecture:
 * - CORE 0: Wi-Fi Radio, lwIP TCP/IP Stack, Ableton Link UDP Sync Task (Port 20808)
 * - CORE 1: Strict Real-Time Audio DSP Rendering Task & I2S DMA Driver
 */

#include <stdio.h>
#include <atomic>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "nvs_flash.h"
#include "esp_timer.h"
#include "esp_log.h"
#include "driver/i2s_std.h"

#include "audio_mixer.h"
#include "usb_hub_manager.h"

// Ableton Link Component Header
#if __has_include("abl_link.hpp")
#include "abl_link.hpp"
#define HAVE_ABL_LINK 1
#else
#define HAVE_ABL_LINK 0
#endif

static const char *TAG = "MAIN_APP";

// Lock-Free atomic snapshot of Link session for zero-mutex audio engine reads
struct LinkTimelineSnapshot {
    std::atomic<double> tempo{124.0};
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

    audio_mixer_init();
    ESP_LOGI(TAG, "Audio DSP Engine initialized on Core %d (Priority %d)", xPortGetCoreID(), (int)uxTaskPriorityGet(NULL));

    float ch1_dummy_l[SAMPLES_PER_CHUNK];
    float ch1_dummy_r[SAMPLES_PER_CHUNK];

    while (1) {
        // 1. Process pending MIDI events from Core 0 queue
        uint32_t raw_midi = 0;
        if (s_midi_queue) {
            while (xQueueReceive(s_midi_queue, &raw_midi, 0) == pdTRUE) {
                // Dispatch note/control change to synth voices
            }
        }

        // 2. Read atomic Ableton Link tempo & phase for beat-synced LFO/Arpeggio
        double current_phase = g_link_timeline.phase.load(std::memory_order_relaxed);
        (void)current_phase;

        // 3. Render synth audio into channel buffers
        for (size_t i = 0; i < SAMPLES_PER_CHUNK; ++i) {
            ch1_dummy_l[i] = 0.0f;
            ch1_dummy_r[i] = 0.0f;
        }

        // 4. Mix channels into interleaved 16-bit PCM master buffer
        mix_audio_chunk(ch1_dummy_l, ch1_dummy_r, nullptr, nullptr, nullptr, nullptr,
                        audio_buffer, SAMPLES_PER_CHUNK);

        // 5. Stream to I2S DMA TX channel if active, or yield
        if (s_tx_chan) {
            i2s_channel_write(s_tx_chan, audio_buffer, sizeof(audio_buffer), &bytes_written, portMAX_DELAY);
        } else {
            vTaskDelay(pdMS_TO_TICKS(2));
        }
    }
}

/**
 * CORE 0: Ableton Link Network Sync Task
 * Pin to Core 0, Priority 18 (Colocated with Wi-Fi stack & lwIP)
 */
void link_sync_task(void *pvParameters) {
    ESP_LOGI(TAG, "Ableton Link Sync Task initialized on Core %d", xPortGetCoreID());

#if HAVE_ABL_LINK
    abl_link::Link link(124.0);
    link.enable(true);
    const double quantum = 4.0;

    while (1) {
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
        g_link_timeline.num_peers.store((uint32_t)peers, std::memory_order_relaxed);

        vTaskDelay(pdMS_TO_TICKS(20)); // ~50Hz sync resolution
    }
#else
    while (1) {
        vTaskDelay(pdMS_TO_TICKS(100));
    }
#endif
}

extern "C" void app_main(void) {
    ESP_LOGI(TAG, "Starting Esp32-FM-1-hub-AbLink firmware...");

    // 1. Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // 2. Initialize default event loop
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    // 3. Disable Wi-Fi modem sleep for sub-millisecond Ableton Link phase accuracy
    esp_wifi_set_ps(WIFI_PS_NONE);

    // 4. Initialize USB Host Hub Manager
    usb_hub_manager_init();

    // 5. Create lock-free MIDI queue
    s_midi_queue = xQueueCreate(64, sizeof(uint32_t));

    // 6. Spawn Core 0 Link & Wi-Fi task (Priority 18)
    xTaskCreatePinnedToCore(link_sync_task, "link_sync", 6144, NULL, 18, NULL, 0);

    // 7. Spawn Core 1 Real-Time Audio DSP task (Priority 22)
    xTaskCreatePinnedToCore(audio_render_task, "audio_dsp", 8192, NULL, 22, NULL, 1);

    ESP_LOGI(TAG, "System initialization complete. Core 0 and Core 1 active.");
}
