import { AdbClient } from '../adb-client.js';
import * as path from 'path';

export class FileTools {
  constructor(private adbClient: AdbClient) {}

  async pushFile(localPath: string, remotePath: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot push file - device is not connected'
        };
      }

      const command = `push "${localPath}" "${remotePath}"`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to push file'
        };
      }

      return {
        success: true,
        data: { 
          localPath,
          remotePath,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `File pushed from ${localPath} to ${remotePath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to push file'
      };
    }
  }

  async pullFile(remotePath: string, localPath?: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot pull file - device is not connected'
        };
      }

      const finalLocalPath = localPath || path.join(process.cwd(), path.basename(remotePath));
      const command = `pull "${remotePath}" "${finalLocalPath}"`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to pull file'
        };
      }

      return {
        success: true,
        data: { 
          remotePath,
          localPath: finalLocalPath,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `File pulled from ${remotePath} to ${finalLocalPath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to pull file'
      };
    }
  }

  async listFiles(remotePath: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot list files - device is not connected'
        };
      }

      const command = `shell ls -la "${remotePath}"`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to list files'
        };
      }

      const files = result.output
        .split('\n')
        .slice(1) // Skip the first line (total)
        .map(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 9) {
            return {
              permissions: parts[0],
              size: parts[4],
              date: `${parts[5]} ${parts[6]} ${parts[7]}`,
              name: parts.slice(8).join(' ')
            };
          }
          return null;
        })
        .filter(file => file !== null);

      return {
        success: true,
        data: { 
          path: remotePath,
          files,
          count: files.length,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `Listed ${files.length} files in ${remotePath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to list files'
      };
    }
  }

  async deleteFile(remotePath: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot delete file - device is not connected'
        };
      }

      const command = `shell rm "${remotePath}"`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to delete file'
        };
      }

      return {
        success: true,
        data: { 
          remotePath,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `File deleted: ${remotePath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete file'
      };
    }
  }

  async createDirectory(remotePath: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot create directory - device is not connected'
        };
      }

      const command = `shell mkdir -p "${remotePath}"`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to create directory'
        };
      }

      return {
        success: true,
        data: { 
          remotePath,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `Directory created: ${remotePath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create directory'
      };
    }
  }
}