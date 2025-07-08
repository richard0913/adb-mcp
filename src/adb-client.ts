import { exec } from 'child_process';
import { promisify } from 'util';
import { AdbDevice, AdbCommandResult, DeviceInfo } from './types/index.js';

const execAsync = promisify(exec);

export class AdbClient {
  private defaultDevice?: string;

  constructor(defaultDevice?: string) {
    this.defaultDevice = defaultDevice;
  }

  async executeCommand(command: string, deviceId?: string): Promise<AdbCommandResult> {
    try {
      const device = deviceId || this.defaultDevice;
      const fullCommand = device 
        ? `adb -s ${device} ${command}`
        : `adb ${command}`;

      const { stdout, stderr } = await execAsync(fullCommand);
      
      return {
        success: true,
        output: stdout.trim(),
        error: stderr || undefined
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
        code: error.code
      };
    }
  }

  async getDevices(): Promise<AdbDevice[]> {
    const result = await this.executeCommand('devices -l');
    
    if (!result.success) {
      throw new Error(`Failed to get devices: ${result.error}`);
    }

    const devices: AdbDevice[] = [];
    const lines = result.output.split('\n').slice(1); // Skip header line
    
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          const device: AdbDevice = {
            id: parts[0],
            status: parts[1] as AdbDevice['status']
          };
          
          // Parse additional info if available
          for (let i = 2; i < parts.length; i++) {
            const [key, value] = parts[i].split(':');
            if (key === 'model') device.model = value;
            if (key === 'product') device.product = value;
            if (key === 'transport') device.transport = value;
          }
          
          devices.push(device);
        }
      }
    }

    return devices;
  }

  async getDeviceInfo(deviceId?: string): Promise<DeviceInfo> {
    const device = deviceId || this.defaultDevice;
    if (!device) {
      throw new Error('No device specified');
    }

    const commands = {
      model: 'shell getprop ro.product.model',
      manufacturer: 'shell getprop ro.product.manufacturer',
      androidVersion: 'shell getprop ro.build.version.release',
      apiLevel: 'shell getprop ro.build.version.sdk',
      screenSize: 'shell wm size'
    };

    const results: Record<string, string> = {};
    
    for (const [key, command] of Object.entries(commands)) {
      const result = await this.executeCommand(command, device);
      results[key] = result.success ? result.output : '';
    }

    // Parse screen size
    const screenMatch = results.screenSize.match(/(\d+)x(\d+)/);
    const screenSize = screenMatch 
      ? { width: parseInt(screenMatch[1]), height: parseInt(screenMatch[2]) }
      : { width: 0, height: 0 };

    return {
      id: device,
      model: results.model,
      manufacturer: results.manufacturer,
      androidVersion: results.androidVersion,
      apiLevel: parseInt(results.apiLevel) || 0,
      screenSize
    };
  }

  async isDeviceConnected(deviceId?: string): Promise<boolean> {
    try {
      const devices = await this.getDevices();
      const device = deviceId || this.defaultDevice;
      
      if (!device) {
        return devices.length > 0 && devices.some(d => d.status === 'device');
      }
      
      return devices.some(d => d.id === device && d.status === 'device');
    } catch {
      return false;
    }
  }

  setDefaultDevice(deviceId: string): void {
    this.defaultDevice = deviceId;
  }

  getDefaultDevice(): string | undefined {
    return this.defaultDevice;
  }
}