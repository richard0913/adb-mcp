export interface PathConfig {
  adbDownloadPath: string;  // Windows path for adb commands
  mcpReadPath: string;      // WSL/Unix path for file reading
}

export class ConfigManager {
  private pathConfig: PathConfig;

  constructor() {
    // Default paths
    this.pathConfig = {
      adbDownloadPath: process.env.ADB_DOWNLOAD_PATH || 'D://tmp',
      mcpReadPath: process.env.MCP_READ_PATH || '/mnt/d/tmp'
    };

    // Ensure directory exists
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Create directory if it doesn't exist (using WSL path)
      const dir = path.dirname(this.pathConfig.mcpReadPath);
      if (!fs.existsSync(this.pathConfig.mcpReadPath)) {
        fs.mkdirSync(this.pathConfig.mcpReadPath, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create screenshot directory:', error);
    }
  }

  getAdbPath(filename: string): string {
    return `${this.pathConfig.adbDownloadPath}/${filename}`;
  }

  getMcpPath(filename: string): string {
    return `${this.pathConfig.mcpReadPath}/${filename}`;
  }

  getPathConfig(): PathConfig {
    return { ...this.pathConfig };
  }

  // Convert WSL path to Windows path for adb commands
  wslToWindowsPath(wslPath: string): string {
    if (wslPath.startsWith('/mnt/')) {
      // Convert /mnt/d/path to D://path
      const drive = wslPath.charAt(5).toUpperCase();
      const remainingPath = wslPath.substring(7).replace(/\//g, '/');
      return `${drive}://${remainingPath}`;
    }
    return wslPath;
  }

  // Convert Windows path to WSL path for file reading
  windowsToWslPath(windowsPath: string): string {
    if (windowsPath.match(/^[A-Z]:\\/)) {
      // Convert D:\path to /mnt/d/path
      const drive = windowsPath.charAt(0).toLowerCase();
      const remainingPath = windowsPath.substring(3).replace(/\\/g, '/');
      return `/mnt/${drive}/${remainingPath}`;
    }
    return windowsPath;
  }
}