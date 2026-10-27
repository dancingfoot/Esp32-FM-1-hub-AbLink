#pragma once

#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

struct MixerChannel {
    float volume;    // 0.0 to 1.5 (+3dB boost)
    float pan;       // -1.0 (Left) to +1.0 (Right)
    bool is_muted;
    bool is_solo;
};

void audio_mixer_init(void);

void mix_audio_chunk(const float *ch1_left, const float *ch1_right,
                     const float *ch2_left, const float *ch2_right,
                     const float *ch3_left, const float *ch3_right,
                     int16_t *master_out_interleaved, size_t num_samples);

void audio_mixer_set_channel(int ch_idx, float vol, float pan, bool muted, bool solo);
void audio_mixer_set_master_volume(float master_vol);

#ifdef __cplusplus
}
#endif
