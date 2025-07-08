export interface AdbDevice {
  id: string;
  model?: string;
  status: 'device' | 'offline' | 'unauthorized';
  product?: string;
  transport?: string;
}

export interface ScreenshotOptions {
  deviceId?: string;
  format?: 'png' | 'jpg';
  quality?: number;
}

export interface ClickOptions {
  deviceId?: string;
  x: number;
  y: number;
  duration?: number;
}

export interface SwipeOptions {
  deviceId?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  duration?: number;
}

export interface InputTextOptions {
  deviceId?: string;
  text: string;
}

export interface AppInfo {
  packageName: string;
  versionName?: string;
  versionCode?: number;
  installed?: boolean;
}

export interface DeviceInfo {
  id: string;
  model: string;
  manufacturer: string;
  androidVersion: string;
  apiLevel: number;
  screenSize: {
    width: number;
    height: number;
  };
  batteryLevel?: number;
}

export interface AdbCommandResult {
  success: boolean;
  output: string;
  error?: string;
  code?: number;
}