#!/usr/bin/env node

/**
 * 后端部署脚本
 * 从环境变量或 .env 文件读取配置
 * 跨平台支持 (Windows/Mac/Linux)
 */

// 加载 .env 文件
const { autoLoad } = require('../scripts/load-env');
autoLoad();

const { spawn } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 获取配置
const config = {
  stackName: process.env.AWS_STACK_NAME || 'zmt-backend',
  region: process.env.AWS_REGION || 'us-east-1',
  cognitoUserPoolArn: process.env.COGNITO_USER_POOL_ARN,
  githubPAT: process.env.GITHUB_PAT || process.env.GH_PAT,
};

// 验证必需的配置
function validateConfig() {
  const missing = [];
  
  if (!config.cognitoUserPoolArn) {
    missing.push('COGNITO_USER_POOL_ARN');
  }
  
  if (!config.githubPAT) {
    missing.push('GITHUB_PAT or GH_PAT');
  }
  
  if (missing.length > 0) {
    log('❌ 错误: 缺少必需的环境变量', 'red');
    log('', 'reset');
    missing.forEach(key => {
      log(`  - ${key}`, 'yellow');
    });
    log('', 'reset');
    log('请在 backend/.env 文件中设置这些变量，或通过环境变量提供', 'yellow');
    process.exit(1);
  }
}

// 运行命令
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`▶ 执行: ${command} ${args.join(' ')}`, 'blue');
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: options.cwd || process.cwd(),
      ...options,
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`命令失败，退出码: ${code}`));
      } else {
        resolve();
      }
    });
    
    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  log('🚀 部署后端 (AWS SAM)', 'blue');
  log('', 'reset');
  
  // 显示配置
  log('配置信息:', 'cyan');
  log(`  Stack 名称: ${config.stackName}`, 'cyan');
  log(`  AWS 区域: ${config.region}`, 'cyan');
  log(`  Cognito User Pool: ${config.cognitoUserPoolArn}`, 'cyan');
  log(`  GitHub PAT: ${config.githubPAT ? '已设置 ✓' : '未设置 ✗'}`, 'cyan');
  log('', 'reset');
  
  // 验证配置
  validateConfig();
  
  const backendDir = path.resolve(__dirname);
  
  try {
    // 1. SAM Build
    log('1/2 构建 SAM 应用...', 'blue');
    await runCommand('sam', ['build'], { cwd: backendDir });
    log('✅ 构建完成', 'green');
    log('', 'reset');
    
    // 2. SAM Deploy
    log('2/2 部署到 AWS...', 'blue');
    
    const deployArgs = [
      'deploy',
      '--stack-name', config.stackName,
      '--region', config.region,
      '--capabilities', 'CAPABILITY_IAM',
      '--resolve-s3',
      '--no-confirm-changeset',
      '--no-fail-on-empty-changeset',
      '--parameter-overrides',
      `CognitoUserPoolArn=${config.cognitoUserPoolArn}`,
      `GitHubPAT=${config.githubPAT}`,
    ];
    
    await runCommand('sam', deployArgs, { cwd: backendDir });
    
    log('', 'reset');
    log('✅ 后端部署成功！', 'green');
    log('', 'reset');
    
    // 获取 API URL
    log('📋 获取部署信息...', 'blue');
    const { execSync } = require('child_process');
    
    try {
      const apiUrl = execSync(
        `aws cloudformation describe-stacks --stack-name ${config.stackName} --region ${config.region} --query 'Stacks[0].Outputs[?OutputKey==\`ApiUrl\`].OutputValue' --output text`,
        { encoding: 'utf8' }
      ).trim();
      
      log('', 'reset');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
      log('🎉 部署完成！', 'green');
      log('', 'reset');
      log(`API URL: ${apiUrl}`, 'cyan');
      log('', 'reset');
      log('下一步:', 'blue');
      log('  1. 更新 .env 文件中的 API URL', 'yellow');
      log('  2. 运行: npm run setup:domain (配置自定义域名)', 'yellow');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
      log('', 'reset');
    } catch (error) {
      log('⚠️  无法获取 API URL，请手动查看 CloudFormation 输出', 'yellow');
    }
    
  } catch (error) {
    log('', 'reset');
    log(`❌ 部署失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 处理 Ctrl+C
process.on('SIGINT', () => {
  console.log('\n');
  log('部署已取消', 'yellow');
  process.exit(0);
});

main();
