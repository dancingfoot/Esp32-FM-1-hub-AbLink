/**
 * @file usb_hub_manager.cpp
 * @brief Multi-Device USB Host Enumeration via USB Hub (FM1Buddy Method)
 */
#include "usb_hub_manager.h"
#include "esp_log.h"
#include "usb/usb_host.h"

static const char *TAG = "USB_HUB_MGR";

static usb_hub_connected_device_t s_devices[4];
static size_t s_device_count = 0;

void usb_hub_manager_init(void) {
    ESP_LOGI(TAG, "Initializing USB Host stack with Hub support...");
    s_device_count = 0;
}

size_t usb_hub_get_connected_devices(usb_hub_connected_device_t *out_devices, size_t max_count) {
    size_t count = (s_device_count < max_count) ? s_device_count : max_count;
    for (size_t i = 0; i < count; i++) {
        out_devices[i] = s_devices[i];
    }
    return count;
}
