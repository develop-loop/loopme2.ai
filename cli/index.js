#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function startServer() {
  console.log('🚀 Starting LoopMe3 server...');
  
  // 设置生产环境
  process.env.NODE_ENV = 'production';
  
  // 找到server的main.js文件
  const serverPath = path.join(__dirname, '..', 'dist', 'server', 'main.js');
  
  if (!fs.existsSync(serverPath)) {
    console.error('❌ Server files not found. Please run "npm run build" first.');
    process.exit(1);
  }
  
  // 启动NestJS服务器
  const serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: process.env.PORT || 7788
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
  });
}

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0] || 'start';

switch (command) {
  case 'start':
    startServer();
    break;
  case '--version':
  case '-v':
    const packageJson = require('../package.json');
    console.log(packageJson.version);
    break;
  case '--help':
  case '-h':
    console.log(`
LoopMe3 CLI

Usage:
  loopme3 [command]

Commands:
  start          Start the server (default)
  --version, -v  Show version
  --help, -h     Show help

Environment Variables:
  PORT           Server port (default: 7788)

Examples:
  loopme3
  loopme3 start
  PORT=8080 loopme3
    `);
    break;
  default:
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run "loopme3 --help" for usage information.');
    process.exit(1);
}