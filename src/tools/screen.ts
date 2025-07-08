import { AdbClient } from '../adb-client.js';
import { ScreenshotOptions, ClickOptions, SwipeOptions, InputTextOptions } from '../types/index.js';
import { ConfigManager } from '../utils/config.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ScreenTools {
  private configManager: ConfigManager;

  constructor(private adbClient: AdbClient) {
    this.configManager = new ConfigManager();
  }

  async takeScreenshot(options: ScreenshotOptions = {}) {
    try {
      const deviceId = options.deviceId;
      const format = options.format || 'png';
      
      // Check if device is connected
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot take screenshot - device is not connected'
        };
      }

      // Take screenshot on device
      const screenshotPath = `/sdcard/screenshot.${format}`;
      const result = await this.adbClient.executeCommand(`shell screencap -p ${screenshotPath}`, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to capture screenshot on device'
        };
      }

      // Use fixed filename for easy access
      const filename = `current_screenshot.${format}`;
      const adbPath = this.configManager.getAdbPath(filename);
      const mcpPath = this.configManager.getMcpPath(filename);
      
      const pullResult = await this.adbClient.executeCommand(`pull ${screenshotPath} ${adbPath}`, deviceId);
      
      if (!pullResult.success) {
        return {
          success: false,
          error: pullResult.error,
          message: 'Failed to pull screenshot from device'
        };
      }

      // Clean up device screenshot
      await this.adbClient.executeCommand(`shell rm ${screenshotPath}`, deviceId);

      // Try to read the file to verify it was downloaded and get file info
      let fileSize = 'Unknown';
      let fileExists = false;
      try {
        const stats = await fs.stat(mcpPath);
        fileSize = `${Math.round(stats.size / 1024)} KB`;
        fileExists = true;
      } catch (error) {
        console.warn('Could not read screenshot file stats:', error);
      }

      return {
        success: true,
        data: { 
          adbPath,
          mcpPath,
          filename,
          format,
          fileSize,
          fileExists,
          deviceId: deviceId || this.adbClient.getDefaultDevice(),
          pullInfo: pullResult.output
        },
        message: `Screenshot saved to ${adbPath} (readable at ${mcpPath})`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to take screenshot'
      };
    }
  }

  async click(options: ClickOptions) {
    try {
      const { x, y, deviceId, duration = 100 } = options;
      
      if (x < 0 || y < 0) {
        return {
          success: false,
          error: 'Invalid coordinates',
          message: 'Coordinates must be positive numbers'
        };
      }

      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot perform click - device is not connected'
        };
      }

      const command = `shell input tap ${x} ${y}`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to perform click'
        };
      }

      return {
        success: true,
        data: { x, y, deviceId: deviceId || this.adbClient.getDefaultDevice() },
        message: `Clicked at coordinates (${x}, ${y})`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to perform click'
      };
    }
  }

  async swipe(options: SwipeOptions) {
    try {
      const { x1, y1, x2, y2, deviceId, duration = 300 } = options;
      
      if (x1 < 0 || y1 < 0 || x2 < 0 || y2 < 0) {
        return {
          success: false,
          error: 'Invalid coordinates',
          message: 'All coordinates must be positive numbers'
        };
      }

      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot perform swipe - device is not connected'
        };
      }

      const command = `shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to perform swipe'
        };
      }

      return {
        success: true,
        data: { 
          from: { x: x1, y: y1 },
          to: { x: x2, y: y2 },
          duration,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `Swiped from (${x1}, ${y1}) to (${x2}, ${y2})`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to perform swipe'
      };
    }
  }

  async inputText(options: InputTextOptions) {
    try {
      const { text, deviceId } = options;
      
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'Empty text',
          message: 'Text cannot be empty'
        };
      }

      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot input text - device is not connected'
        };
      }

      // Escape special characters for shell
      const escapedText = text.replace(/["\\\s]/g, '\\$&');
      const command = `shell input text "${escapedText}"`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to input text'
        };
      }

      return {
        success: true,
        data: { 
          text,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `Input text: "${text}"`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to input text'
      };
    }
  }

  async pressKey(keyCode: string | number, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot press key - device is not connected'
        };
      }

      const command = `shell input keyevent ${keyCode}`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to press key'
        };
      }

      return {
        success: true,
        data: { 
          keyCode,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `Pressed key: ${keyCode}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to press key'
      };
    }
  }

}