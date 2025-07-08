import { AdbClient } from '../adb-client.js';

export class ShellTools {
  constructor(private adbClient: AdbClient) {}

  async executeShellCommand(command: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot execute shell command - device is not connected'
        };
      }

      // Basic security check - prevent potentially dangerous commands
      const dangerousCommands = [
        'rm -rf /',
        'format',
        'factory_reset',
        'reboot bootloader',
        'fastboot',
        'dd if='
      ];

      const lowerCommand = command.toLowerCase();
      for (const dangerous of dangerousCommands) {
        if (lowerCommand.includes(dangerous)) {
          return {
            success: false,
            error: 'Dangerous command blocked',
            message: `Command contains potentially dangerous operation: ${dangerous}`
          };
        }
      }

      const shellCommand = `shell ${command}`;
      const result = await this.adbClient.executeCommand(shellCommand, deviceId);
      
      return {
        success: result.success,
        data: { 
          command,
          output: result.output,
          error: result.error,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: result.success ? 'Command executed successfully' : 'Command execution failed'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to execute shell command'
      };
    }
  }

  async getSystemInfo(deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot get system info - device is not connected'
        };
      }

      const commands = {
        androidVersion: 'getprop ro.build.version.release',
        apiLevel: 'getprop ro.build.version.sdk',
        manufacturer: 'getprop ro.product.manufacturer',
        model: 'getprop ro.product.model',
        brand: 'getprop ro.product.brand',
        device: 'getprop ro.product.device',
        buildId: 'getprop ro.build.id',
        kernel: 'uname -r',
        uptime: 'uptime',
        meminfo: 'cat /proc/meminfo | head -5',
        cpuinfo: 'cat /proc/cpuinfo | grep "model name" | head -1'
      };

      const systemInfo: Record<string, string> = {};
      
      for (const [key, cmd] of Object.entries(commands)) {
        const result = await this.adbClient.executeCommand(`shell ${cmd}`, deviceId);
        systemInfo[key] = result.success ? result.output.trim() : 'N/A';
      }

      return {
        success: true,
        data: {
          ...systemInfo,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: 'System information retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get system info'
      };
    }
  }

  async getBatteryInfo(deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot get battery info - device is not connected'
        };
      }

      const command = 'shell dumpsys battery';
      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to get battery info'
        };
      }

      // Parse battery information
      const output = result.output;
      const batteryInfo = {
        level: this.extractValue(output, 'level'),
        scale: this.extractValue(output, 'scale'),
        status: this.extractValue(output, 'status'),
        health: this.extractValue(output, 'health'),
        present: this.extractValue(output, 'present'),
        plugged: this.extractValue(output, 'plugged'),
        voltage: this.extractValue(output, 'voltage'),
        temperature: this.extractValue(output, 'temperature'),
        technology: this.extractValue(output, 'technology')
      };

      return {
        success: true,
        data: {
          ...batteryInfo,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: 'Battery information retrieved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get battery info'
      };
    }
  }

  private extractValue(text: string, key: string): string {
    const regex = new RegExp(`${key}:\\s*(.+)`);
    const match = text.match(regex);
    return match ? match[1].trim() : 'N/A';
  }

  async getLogcat(lines: number = 100, tag?: string, deviceId?: string) {
    try {
      const connected = await this.adbClient.isDeviceConnected(deviceId);
      if (!connected) {
        return {
          success: false,
          error: 'Device not connected',
          message: 'Cannot get logcat - device is not connected'
        };
      }

      let command = `shell logcat -d -t ${lines}`;
      if (tag) {
        command += ` -s ${tag}`;
      }

      const result = await this.adbClient.executeCommand(command, deviceId);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          message: 'Failed to get logcat'
        };
      }

      return {
        success: true,
        data: {
          logs: result.output,
          lines,
          tag,
          deviceId: deviceId || this.adbClient.getDefaultDevice()
        },
        message: `Retrieved ${lines} logcat lines${tag ? ` for tag: ${tag}` : ''}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to get logcat'
      };
    }
  }
}