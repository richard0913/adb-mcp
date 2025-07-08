import { AdbClient } from '../adb-client.js';

export class DeviceTools {
  constructor(private adbClient: AdbClient) {}

  async listDevices() {
    try {
      const devices = await this.adbClient.getDevices();
      return {
        success: true,
        data: devices,
        message: `Found ${devices.length} device(s)`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to list devices'
      };
    }
  }

  async getDeviceInfo(deviceId?: string) {
    try {
      const deviceInfo = await this.adbClient.getDeviceInfo(deviceId);
      return {
        success: true,
        data: deviceInfo,
        message: `Device info retrieved for ${deviceInfo.id}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get device info'
      };
    }
  }

  async checkConnection(deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      return {
        success: true,
        data: { connected },
        message: connected ? 'Device is connected' : 'Device is not connected'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to check device connection'
      };
    }
  }

  async setDefaultDevice(deviceId: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot set default device - device is not connected'
        };
      }

      this.adbClient.setDefaultDevice(deviceId);
      return {
        success: true,
        data: { deviceId },
        message: `Default device set to ${deviceId}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to set default device'
      };
    }
  }

  async getDefaultDevice() {
    const deviceId = this.adbClient.getDefaultDevice();
    return {
      success: true,
      data: { deviceId },
      message: deviceId ? `Default device is ${deviceId}` : 'No default device set'
    };
  }
}