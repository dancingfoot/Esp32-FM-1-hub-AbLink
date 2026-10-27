/**
 * @file audio_mixer.cpp
 * @brief Multi-channel DSP Audio Mixer running on ESP32-S3 Core 1
 */
#include "audio_mixer.h"
#include <math.h>

static MixerChannel s_channels[3] = {
    { 0.85f, -0.2f, false, false }, // Ch 1: FM-1 #1 (USB Audio)
    { 0.85f,  0.2f, false, false }, // Ch 2: FM-1 #2 (USB Audio)
    { 0.70f,  0.0f, false, false }, // Ch 3: Local ESP DSP (Felucca FM)
};

static float s_master_volume = 0.90f;

void audio_mixer_init(void) {
    s_channels[0] = { 0.85f, -0.2f, false, false };
    s_channels[1] = { 0.85f,  0.2f, false, false };
    s_channels[2] = { 0.70f,  0.0f, false, false };
    s_master_volume = 0.90f;
}

void audio_mixer_set_channel(int ch_idx, float vol, float pan, bool muted, bool solo) {
    if (ch_idx >= 0 && ch_idx < 3) {
        s_channels[ch_idx].volume = vol;
        s_channels[ch_idx].pan = pan;
        s_channels[ch_idx].is_muted = muted;
        s_channels[ch_idx].is_solo = solo;
    }
}

void audio_mixer_set_master_volume(float master_vol) {
    s_master_volume = master_vol;
}

void mix_audio_chunk(const float *ch1_left, const float *ch1_right,
                     const float *ch2_left, const float *ch2_right,
                     const float *ch3_left, const float *ch3_right,
                     int16_t *master_out_interleaved, size_t num_samples) {
    
    bool any_solo = s_channels[0].is_solo || s_channels[1].is_solo || s_channels[2].is_solo;

    for (size_t i = 0; i < num_samples; ++i) {
        float sum_left = 0.0f;
        float sum_right = 0.0f;

        // Channel 1
        if (ch1_left && ch1_right && !s_channels[0].is_muted && (!any_solo || s_channels[0].is_solo)) {
            float gain_l = s_channels[0].volume * (1.0f - fmaxf(0.0f, s_channels[0].pan));
            float gain_r = s_channels[0].volume * (1.0f + fminf(0.0f, s_channels[0].pan));
            sum_left  += ch1_left[i]  * gain_l;
            sum_right += ch1_right[i] * gain_r;
        }

        // Channel 2
        if (ch2_left && ch2_right && !s_channels[1].is_muted && (!any_solo || s_channels[1].is_solo)) {
            float gain_l = s_channels[1].volume * (1.0f - fmaxf(0.0f, s_channels[1].pan));
            float gain_r = s_channels[1].volume * (1.0f + fminf(0.0f, s_channels[1].pan));
            sum_left  += ch2_left[i]  * gain_l;
            sum_right += ch2_right[i] * gain_r;
        }

        // Channel 3 (Local ESP Synth)
        if (ch3_left && ch3_right && !s_channels[2].is_muted && (!any_solo || s_channels[2].is_solo)) {
            sum_left  += ch3_left[i]  * s_channels[2].volume;
            sum_right += ch3_right[i] * s_channels[2].volume;
        }

        // Master Volume
        sum_left  *= s_master_volume;
        sum_right *= s_master_volume;

        // Soft limiter to prevent digital overs
        sum_left  = fmaxf(-1.0f, fminf(1.0f, sum_left));
        sum_right = fmaxf(-1.0f, fminf(1.0f, sum_right));

        // Interleaved 16-bit PCM for I2S DMA or USB Audio Out
        master_out_interleaved[i * 2]     = (int16_t)(sum_left  * 32767.0f);
        master_out_interleaved[i * 2 + 1] = (int16_t)(sum_right * 32767.0f);
    }
}
