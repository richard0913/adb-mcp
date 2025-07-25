# ADB MCP

A Model Context Protocol (MCP) server that provides Android Debug Bridge (ADB) functionality for automating Android devices.

<a href="https://glama.ai/mcp/servers/@richard0913/adb-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@richard0913/adb-mcp/badge" alt="ADB Server MCP server" />
</a>

## Features

### Device Management
- List connected devices
- Get device information
- Set default device for operations
- Check device connection status

### Screen Operations
- Take screenshots
- Click at coordinates
- Swipe gestures
- Input text
- Press keys

### App Management
- Install/uninstall apps
- Start/stop apps
- List installed apps
- Get app information

### File Operations
- Push files to device
- Pull files from device
- List files and directories
- Create directories
- Delete files

### Shell Commands
- Execute shell commands
- Get system information
- Get battery information
- Get logcat output

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Prerequisites
- Android Debug Bridge (adb) must be installed and available in PATH
- Android device connected via USB with USB debugging enabled
- Device must be authorized for debugging

### Running the Server
```bash
npm start
```

### Available Tools

#### Device Management
- `adb_list_devices` - List all connected devices
- `adb_get_device_info` - Get device information
- `adb_set_default_device` - Set default device

#### Screen Operations
- `adb_screenshot` - Take screenshot
- `adb_click` - Click at coordinates
- `adb_swipe` - Swipe gesture
- `adb_input_text` - Input text
- `adb_press_key` - Press key

#### App Management
- `adb_install_app` - Install APK
- `adb_uninstall_app` - Uninstall app
- `adb_start_app` - Start app
- `adb_stop_app` - Stop app
- `adb_list_apps` - List installed apps

#### File Operations
- `adb_push_file` - Push file to device
- `adb_pull_file` - Pull file from device
- `adb_list_files` - List files in directory

#### Shell Commands
- `adb_shell` - Execute shell command
- `adb_get_system_info` - Get system information
- `adb_get_battery_info` - Get battery information
- `adb_get_logcat` - Get logcat output

## Security

The server includes basic security measures:
- Dangerous shell commands are blocked
- File path validation
- Device connection verification
- Input sanitization

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Lint
```bash
npm run lint
```

### MCP
```bash
      "mcpServers": {
        "adb-mcp": {
          "type": "stdio",
          "command": "node",
          "args": [
            "/adb-mcp/dist/index.js"
          ],
          "env": {
            "ADB_DOWNLOAD_PATH": "/adb-mcp",
            "MCP_READ_PATH": "/adb-mcp"
          }
        }
      }
```

## License

MIT