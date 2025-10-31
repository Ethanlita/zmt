#!/usr/bin/env node

/**
 * 清理损坏的 CloudFormation Stack
 * 跨平台支持 (Windows/Mac/Linux)
 */

// 加载 .env 文件（如果存在）
const { autoLoad } = require('./load-env');
autoLoad();

const { CloudFormationClient, DescribeStacksCommand, DeleteStackCommand } = require('@aws-sdk/client-cloudformation');
const readline = require('readline');

// 颜色输出
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

// 创建 readline 接口
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// 等待 stack 删除完成
async function waitForStackDeletion(client, stackName) {
  log('⏳ 等待删除完成...', 'yellow');
  
  while (true) {
    try {
      const response = await client.send(new DescribeStacksCommand({
        StackName: stackName,
      }));
      
      const status = response.Stacks[0].StackStatus;
      
      if (status === 'DELETE_IN_PROGRESS') {
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒
        continue;
      }
      
      if (status === 'DELETE_FAILED') {
        log('\n❌ 删除失败', 'red');
        process.exit(1);
      }
      
    } catch (error) {
      if (error.name === 'ValidationError' || error.message.includes('does not exist')) {
        log('\n✅ Stack 删除完成', 'green');
        return;
      }
      throw error;
    }
  }
}

async function main() {
  // 从环境变量或命令行参数获取配置
  const stackName = process.env.AWS_STACK_NAME || process.argv[2] || 'zmt-backend';
  const region = process.env.AWS_REGION || process.argv[3] || 'us-east-1';

  log(`🔍 检查 CloudFormation Stack: ${stackName}`, 'blue');
  console.log('');

  const client = new CloudFormationClient({ region });

  try {
    // 检查 stack 是否存在
    const response = await client.send(new DescribeStacksCommand({
      StackName: stackName,
    }));

    const stack = response.Stacks[0];
    const status = stack.StackStatus;

    log(`当前状态: ${status}`, 'yellow');
    console.log('');

    // 根据状态决定操作
    switch (status) {
      case 'CREATE_IN_PROGRESS':
        log('⚠️  Stack 正在创建中，建议等待完成或失败后再清理', 'yellow');
        const continueCreate = await askQuestion('是否立即删除？[y/N] ');
        if (continueCreate.toLowerCase() !== 'y') {
          log('取消删除', 'yellow');
          process.exit(0);
        }
        break;

      case 'CREATE_FAILED':
      case 'ROLLBACK_COMPLETE':
      case 'ROLLBACK_IN_PROGRESS':
      case 'DELETE_FAILED':
        log(`⚠️  检测到损坏的 Stack (状态: ${status})`, 'red');
        log('开始删除...', 'blue');
        break;

      case 'CREATE_COMPLETE':
      case 'UPDATE_COMPLETE':
      case 'UPDATE_ROLLBACK_COMPLETE':
        log(`✅ Stack 状态正常 (状态: ${status})`, 'green');
        const continueNormal = await askQuestion('是否仍要删除此 Stack？[y/N] ');
        if (continueNormal.toLowerCase() !== 'y') {
          log('取消删除', 'yellow');
          process.exit(0);
        }
        break;

      case 'DELETE_IN_PROGRESS':
        log('⏳ Stack 正在删除中，请等待...', 'yellow');
        await waitForStackDeletion(client, stackName);
        process.exit(0);

      case 'DELETE_COMPLETE':
        log('✅ Stack 已被删除', 'green');
        process.exit(0);

      default:
        log(`⚠️  未知状态: ${status}`, 'yellow');
        const continueUnknown = await askQuestion('是否继续删除？[y/N] ');
        if (continueUnknown.toLowerCase() !== 'y') {
          log('取消删除', 'yellow');
          process.exit(0);
        }
    }

    // 执行删除
    console.log('');
    log(`🗑️  删除 Stack: ${stackName}`, 'blue');
    
    await client.send(new DeleteStackCommand({
      StackName: stackName,
    }));

    // 等待删除完成
    await waitForStackDeletion(client, stackName);

    console.log('');
    log(`✅ Stack '${stackName}' 已成功删除`, 'green');
    console.log('');

  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('does not exist')) {
      log(`✅ Stack '${stackName}' 不存在，无需清理`, 'green');
      process.exit(0);
    }

    log(`❌ 错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 处理 Ctrl+C
process.on('SIGINT', () => {
  console.log('\n');
  log('操作已取消', 'yellow');
  process.exit(0);
});

main();
