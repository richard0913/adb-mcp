#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';

import { AdbClient } from './adb-client.js';
import { DeviceTools } from './tools/device.js';
import { ScreenTools } from './tools/screen.js';
import { AppTools } from './tools/app.js';
import { FileTools } from './tools/file.js';
import { ShellTools } from './tools/shell.js';

class AdbMcpServer {
  private server: Server;
  private adbClient: AdbClient;
  private deviceTools: DeviceTools;
  private screenTools: ScreenTools;
  private appTools: AppTools;
  private fileTools: FileTools;
  private shellTools: ShellTools;

  constructor() {
    this.server = new Server(
      {
        name: 'adb-mcp',
        version: '1.0.0',
      }
    );

    this.adbClient = new AdbClient();
    this.deviceTools = new DeviceTools(this.adbClient);
    this.screenTools = new ScreenTools(this.adbClient);
    this.appTools = new AppTools(this.adbClient);
    this.fileTools = new FileTools(this.adbClient);
    this.shellTools = new ShellTools(this.adbClient);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Device management tools
          {
            name: 'adb_list_devices',
            description: 'List all connected Android devices',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'adb_get_device_info',
            description: 'Get detailed information about a specific device',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional, uses default device if not specified)',
                },
              },
              required: [],
            },
          },
          {
            name: 'adb_set_default_device',
            description: 'Set the default device for subsequent operations',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: 'Device ID to set as default',
                },
              },
              required: ['deviceId'],
            },
          },
          // Screen tools
          {
            name: 'adb_screenshot',
            description: 'Take a screenshot of the device screen',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
                format: {
                  type: 'string',
                  enum: ['png', 'jpg'],
                  description: 'Screenshot format (default: png)',
                },
              },
              required: [],
            },
          },
          {
            name: 'adb_click',
            description: 'Click at specific coordinates on the device screen',
            inputSchema: {
              type: 'object',
              properties: {
                x: {
                  type: 'number',
                  description: 'X coordinate',
                },
                y: {
                  type: 'number',
                  description: 'Y coordinate',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['x', 'y'],
            },
          },
          {
            name: 'adb_swipe',
            description: 'Swipe from one point to another on the device screen',
            inputSchema: {
              type: 'object',
              properties: {
                x1: {
                  type: 'number',
                  description: 'Start X coordinate',
                },
                y1: {
                  type: 'number',
                  description: 'Start Y coordinate',
                },
                x2: {
                  type: 'number',
                  description: 'End X coordinate',
                },
                y2: {
                  type: 'number',
                  description: 'End Y coordinate',
                },
                duration: {
                  type: 'number',
                  description: 'Swipe duration in milliseconds (default: 300)',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['x1', 'y1', 'x2', 'y2'],
            },
          },
          {
            name: 'adb_input_text',
            description: 'Input text on the device',
            inputSchema: {
              type: 'object',
              properties: {
                text: {
                  type: 'string',
                  description: 'Text to input',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['text'],
            },
          },
          {
            name: 'adb_press_key',
            description: 'Press a key on the device',
            inputSchema: {
              type: 'object',
              properties: {
                keyCode: {
                  type: ['string', 'number'],
                  description: 'Key code to press (e.g., "BACK", "HOME", "MENU", or numeric code)',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['keyCode'],
            },
          },
          // App management tools
          {
            name: 'adb_install_app',
            description: 'Install an APK file on the device',
            inputSchema: {
              type: 'object',
              properties: {
                apkPath: {
                  type: 'string',
                  description: 'Path to the APK file',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['apkPath'],
            },
          },
          {
            name: 'adb_uninstall_app',
            description: 'Uninstall an app from the device',
            inputSchema: {
              type: 'object',
              properties: {
                packageName: {
                  type: 'string',
                  description: 'Package name of the app to uninstall',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['packageName'],
            },
          },
          {
            name: 'adb_start_app',
            description: 'Start an app on the device',
            inputSchema: {
              type: 'object',
              properties: {
                packageName: {
                  type: 'string',
                  description: 'Package name of the app to start',
                },
                activityName: {
                  type: 'string',
                  description: 'Activity name (optional)',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['packageName'],
            },
          },
          {
            name: 'adb_stop_app',
            description: 'Stop an app on the device',
            inputSchema: {
              type: 'object',
              properties: {
                packageName: {
                  type: 'string',
                  description: 'Package name of the app to stop',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['packageName'],
            },
          },
          {
            name: 'adb_list_apps',
            description: 'List installed apps on the device',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: [],
            },
          },
          // File operations
          {
            name: 'adb_push_file',
            description: 'Push a file from local system to device',
            inputSchema: {
              type: 'object',
              properties: {
                localPath: {
                  type: 'string',
                  description: 'Local file path',
                },
                remotePath: {
                  type: 'string',
                  description: 'Remote file path on device',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['localPath', 'remotePath'],
            },
          },
          {
            name: 'adb_pull_file',
            description: 'Pull a file from device to local system',
            inputSchema: {
              type: 'object',
              properties: {
                remotePath: {
                  type: 'string',
                  description: 'Remote file path on device',
                },
                localPath: {
                  type: 'string',
                  description: 'Local file path (optional)',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['remotePath'],
            },
          },
          {
            name: 'adb_list_files',
            description: 'List files in a directory on the device',
            inputSchema: {
              type: 'object',
              properties: {
                remotePath: {
                  type: 'string',
                  description: 'Remote directory path on device',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['remotePath'],
            },
          },
          // Shell commands
          {
            name: 'adb_shell',
            description: 'Execute a shell command on the device',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'Shell command to execute',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: ['command'],
            },
          },
          {
            name: 'adb_get_system_info',
            description: 'Get system information from the device',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: [],
            },
          },
          {
            name: 'adb_get_battery_info',
            description: 'Get battery information from the device',
            inputSchema: {
              type: 'object',
              properties: {
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: [],
            },
          },
          {
            name: 'adb_get_logcat',
            description: 'Get logcat output from the device',
            inputSchema: {
              type: 'object',
              properties: {
                lines: {
                  type: 'number',
                  description: 'Number of lines to retrieve (default: 100)',
                },
                tag: {
                  type: 'string',
                  description: 'Filter by tag (optional)',
                },
                deviceId: {
                  type: 'string',
                  description: 'Device ID (optional)',
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Device management
          case 'adb_list_devices':
            return await this.handleToolCall(this.deviceTools.listDevices());
          case 'adb_get_device_info':
            return await this.handleToolCall(this.deviceTools.getDeviceInfo(args?.deviceId as string));
          case 'adb_set_default_device':
            return await this.handleToolCall(this.deviceTools.setDefaultDevice(args?.deviceId as string));

          // Screen operations
          case 'adb_screenshot':
            return await this.handleToolCall(this.screenTools.takeScreenshot(args || {}));
          case 'adb_click':
            return await this.handleToolCall(this.screenTools.click(args as any));
          case 'adb_swipe':
            return await this.handleToolCall(this.screenTools.swipe(args as any));
          case 'adb_input_text':
            return await this.handleToolCall(this.screenTools.inputText(args as any));
          case 'adb_press_key':
            return await this.handleToolCall(this.screenTools.pressKey(args?.keyCode as string | number, args?.deviceId as string));

          // App management
          case 'adb_install_app':
            return await this.handleToolCall(this.appTools.installApp(args?.apkPath as string, args?.deviceId as string));
          case 'adb_uninstall_app':
            return await this.handleToolCall(this.appTools.uninstallApp(args?.packageName as string, args?.deviceId as string));
          case 'adb_start_app':
            return await this.handleToolCall(this.appTools.startApp(args?.packageName as string, args?.activityName as string, args?.deviceId as string));
          case 'adb_stop_app':
            return await this.handleToolCall(this.appTools.stopApp(args?.packageName as string, args?.deviceId as string));
          case 'adb_list_apps':
            return await this.handleToolCall(this.appTools.listInstalledApps(args?.deviceId as string));

          // File operations
          case 'adb_push_file':
            return await this.handleToolCall(this.fileTools.pushFile(args?.localPath as string, args?.remotePath as string, args?.deviceId as string));
          case 'adb_pull_file':
            return await this.handleToolCall(this.fileTools.pullFile(args?.remotePath as string, args?.localPath as string, args?.deviceId as string));
          case 'adb_list_files':
            return await this.handleToolCall(this.fileTools.listFiles(args?.remotePath as string, args?.deviceId as string));

          // Shell commands
          case 'adb_shell':
            return await this.handleToolCall(this.shellTools.executeShellCommand(args?.command as string, args?.deviceId as string));
          case 'adb_get_system_info':
            return await this.handleToolCall(this.shellTools.getSystemInfo(args?.deviceId as string));
          case 'adb_get_battery_info':
            return await this.handleToolCall(this.shellTools.getBatteryInfo(args?.deviceId as string));
          case 'adb_get_logcat':
            return await this.handleToolCall(this.shellTools.getLogcat(args?.lines as number, args?.tag as string, args?.deviceId as string));

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  private async handleToolCall(resultPromise: Promise<any>) {
    const result = await resultPromise;
    
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ADB MCP server running on stdio');
  }
}

const server = new AdbMcpServer();
server.run().catch(console.error);