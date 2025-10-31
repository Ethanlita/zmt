/**
 * 简单的 .env 文件加载器
 * 不需要额外依赖，跨平台支持
 */

const fs = require('fs');
const path = require('path');

function loadEnv(envPath = '.env') {
  const absolutePath = path.resolve(process.cwd(), envPath);
  
  if (!fs.existsSync(absolutePath)) {
    // 尝试在父目录查找
    const parentPath = path.resolve(process.cwd(), '..', envPath);
    if (!fs.existsSync(parentPath)) {
      return; // 文件不存在，不报错
    }
    return loadEnvFile(parentPath);
  }
  
  loadEnvFile(absolutePath);
}

function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach(line => {
    // 跳过注释和空行
    line = line.trim();
    if (!line || line.startsWith('#')) {
      return;
    }
    
    // 解析 KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // 只设置尚未设置的环境变量（优先使用系统环境变量）
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// 自动加载多个可能的 .env 文件
function autoLoad() {
  const envFiles = [
    'backend/.env',
    '.env',
    '../backend/.env',
    '../.env'
  ];
  
  for (const envFile of envFiles) {
    loadEnv(envFile);
  }
}

module.exports = { loadEnv, autoLoad };
