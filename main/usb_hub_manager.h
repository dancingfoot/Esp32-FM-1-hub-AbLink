#pragma once

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint8_t dev_addr;
    bool is_fm1;
    bool is_midi_keyboard;
} usb_hub_connected_device_t;

void usb_hub_manager_init(void);
size_t usb_hub_get_connected_devices(usb_hub_connected_device_t *out_devices, size_t max_count);

#ifdef __cplusplus
}
#endif
