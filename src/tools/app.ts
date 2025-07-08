import { AdbClient } from '../adb-client.js';
import { AppInfo } from '../types/index.js';

export class AppTools {
  constructor(private adbClient: AdbClient) {}

  async installApp(apkPath: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot install app - device is not connected'
        };
      }

      const command = `install "${apkPath}"`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success || result.output.includes('Failure')) {
        return {
          success: false,
          error: result.error || result.output,
          message: 'Failed to install app'
        };
      }

      return {
        success: true,
        data: { apkPath, deviceId: deviceId || this.adbClient.getDefaultDevice() },
        message: `App installed successfully from ${apkPath}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to install app'
      };
    }
  }

  async uninstallApp(packageName: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot uninstall app - device is not connected'
        };
      }

      const command = `uninstall ${packageName}`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success || result.output.includes('Failure')) {
        return {
          success: false,
          error: result.error || result.output,
          message: 'Failed to uninstall app'
        };
      }

      return {
        success: true,
        data: { packageName, deviceId: deviceId || this.adbClient.getDefaultDevice() },
        message: `App ${packageName} uninstalled successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to uninstall app'
      };
    }
  }

  async startApp(packageName: string, activityName?: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot start app - device is not connected'
        };
      }

      let command: string;
      if (activityName) {
        command = `shell am start -n ${packageName}/${activityName}`;
      } else {
        command = `shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
      }

      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to start app'
        };
      }

      return {
        success: true,
        data: { 
          packageName, 
          activityName,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `App ${packageName} started successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to start app'
      };
    }
  }

  async stopApp(packageName: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot stop app - device is not connected'
        };
      }

      const command = `shell am force-stop ${packageName}`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to stop app'
        };
      }

      return {
        success: true,
        data: { packageName, deviceId: deviceId || this.adbClient.getDefaultDevice() },
        message: `App ${packageName} stopped successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to stop app'
      };
    }
  }

  async listInstalledApps(deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot list apps - device is not connected'
        };
      }

      const command = 'shell pm list packages -3';
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to list installed apps'
        };
      }

      const packages = result.output
        .split('\n')
        .map(line => line.replace('package:', '').trim())
        .filter(line => line.length > 0);

      return {
        success: true,
        data: { 
          packages,
          count: packages.length,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `Found ${packages.length} installed apps`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to list installed apps'
      };
    }
  }

  async getAppInfo(packageName: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot get app info - device is not connected'
        };
      }

      const command = `shell dumpsys package ${packageName}`;
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to get app info'
        };
      }

      // Parse app info from dumpsys output
      const output = result.output;
      const versionNameMatch = output.match(/versionName=([^\s]+)/);
      const versionCodeMatch = output.match(/versionCode=(\d+)/);
      
      const appInfo: AppInfo = {
        packageName,
        versionName: versionNameMatch ? versionNameMatch[1] : undefined,
        versionCode: versionCodeMatch ? parseInt(versionCodeMatch[1]) : undefined,
        installed: !output.includes('Unable to find package')
      };

      return {
        success: true,
        data: appInfo,
        message: `App info retrieved for ${packageName}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get app info'
      };
    }
  }
}