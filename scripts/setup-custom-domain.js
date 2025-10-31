#!/usr/bin/env node

/**
 * 配置 API Gateway 自定义域名
 * 1. 验证 ACM 证书
 * 2. 创建边缘优化的自定义域名
 * 3. 配置 Base Path Mapping
 * 4. 输出 CloudFront 域名供 DNS 配置
 * 
 * 配置来源（优先级从高到低）：
 * 1. 环境变量（GitHub Actions）
 * 2. .env 文件（本地开发）
 * 3. 命令行参数
 */

// 加载 .env 文件（如果存在）
const { autoLoad } = require('./load-env');
autoLoad();

const {
  APIGatewayClient,
  GetRestApisCommand,
  CreateDomainNameCommand,
  GetDomainNameCommand,
  CreateBasePathMappingCommand,
} = require('@aws-sdk/client-api-gateway');
const {
  ACMClient,
  RequestCertificateCommand,
  DescribeCertificateCommand,
  ListCertificatesCommand,
} = require('@aws-sdk/client-acm');
const { CloudFormationClient, DescribeStacksCommand } = require('@aws-sdk/client-cloudformation');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 等待证书验证
async function waitForCertificateValidation(acmClient, certificateArn, maxWaitTime = 600000) {
  log('⏳ 等待证书验证（需要在 DNS 中添加验证记录）...', 'yellow');
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const response = await acmClient.send(new DescribeCertificateCommand({
      CertificateArn: certificateArn,
    }));
    
    const status = response.Certificate.Status;
    
    if (status === 'ISSUED') {
      log('✅ 证书已验证并颁发', 'green');
      return true;
    }
    
    if (status === 'FAILED' || status === 'VALIDATION_TIMED_OUT') {
      log(`❌ 证书验证失败: ${status}`, 'red');
      return false;
    }
    
    if (status === 'PENDING_VALIDATION') {
      // 显示验证记录
      if (response.Certificate.DomainValidationOptions) {
        console.log('');
        log('📋 请在 DNS 中添加以下 CNAME 记录以验证域名：', 'cyan');
        response.Certificate.DomainValidationOptions.forEach((option) => {
          if (option.ResourceRecord) {
            console.log(`  域名: ${option.DomainName}`);
            console.log(`  记录类型: ${option.ResourceRecord.Type}`);
            console.log(`  记录名称: ${option.ResourceRecord.Name}`);
            console.log(`  记录值: ${option.ResourceRecord.Value}`);
            console.log('');
          }
        });
      }
    }
    
    process.stdout.write('.');
    await new Promise((resolve) => setTimeout(resolve, 10000)); // 等待 10 秒
  }
  
  log('\n⏰ 证书验证超时', 'yellow');
  return false;
}

async function main() {
  // 从环境变量或命令行参数获取配置
  const domainName = process.env.API_CUSTOM_DOMAIN || process.argv[2] || 'api.zunmingtea.com';
  const stackName = process.env.AWS_STACK_NAME || process.argv[3] || 'zmt-backend';
  const region = process.env.AWS_REGION || process.argv[4] || 'us-east-1';
  const certificateArn = process.env.ACM_CERTIFICATE_ARN || process.argv[5];

  if (!certificateArn) {
    log('❌ 错误: 未提供 ACM 证书 ARN', 'red');
    log('请设置环境变量 ACM_CERTIFICATE_ARN 或通过命令行参数提供', 'yellow');
    log('示例: ACM_CERTIFICATE_ARN=arn:aws:acm:... npm run setup:domain', 'cyan');
    process.exit(1);
  }

  log('🚀 配置 API Gateway 自定义域名', 'blue');
  log(`域名: ${domainName}`, 'cyan');
  log(`Stack: ${stackName}`, 'cyan');
  log(`区域: ${region}`, 'cyan');
  log(`证书: ${certificateArn.substring(0, 50)}...`, 'cyan');
  console.log('');

  const apiGatewayClient = new APIGatewayClient({ region });
  const acmClient = new ACMClient({ region: 'us-east-1' }); // ACM 证书必须在 us-east-1
  const cfnClient = new CloudFormationClient({ region });

  try {
    // 1. 获取 API Gateway ID
    log('1️⃣  获取 API Gateway ID...', 'blue');
    
    const stackResponse = await cfnClient.send(new DescribeStacksCommand({
      StackName: stackName,
    }));
    
    const apiId = stackResponse.Stacks[0].Outputs.find(
      (output) => output.OutputKey === 'ApiId'
    )?.OutputValue;
    
    if (!apiId) {
      log('❌ 无法从 CloudFormation Stack 获取 API Gateway ID', 'red');
      process.exit(1);
    }
    
    log(`✅ API Gateway ID: ${apiId}`, 'green');
    console.log('');

    // 2. 验证 ACM 证书
    log('2️⃣  验证 ACM 证书...', 'blue');
    
    try {
      const certDetails = await acmClient.send(new DescribeCertificateCommand({
        CertificateArn: certificateArn,
      }));
      
      const certificateStatus = certDetails.Certificate.Status;
      const domainList = certDetails.Certificate.SubjectAlternativeNames || [];
      
      log(`✅ 证书信息:`, 'green');
      log(`   ARN: ${certificateArn}`, 'cyan');
      log(`   域名: ${certDetails.Certificate.DomainName}`, 'cyan');
      log(`   状态: ${certificateStatus}`, 'cyan');
      log(`   覆盖域名: ${domainList.join(', ')}`, 'cyan');
      
      // 检查证书状态
      if (certificateStatus !== 'ISSUED') {
        log(`❌ 证书状态不是 ISSUED: ${certificateStatus}`, 'red');
        log('请确保证书已完成验证', 'yellow');
        process.exit(1);
      }
      
      // 检查证书是否覆盖了我们的域名
      const coversDomain = domainList.some(d => 
        d === domainName || 
        (d.startsWith('*.') && domainName.endsWith(d.substring(1)))
      );
      
      if (!coversDomain) {
        log(`❌ 证书不包含域名 ${domainName}`, 'red');
        log(`   证书包含的域名: ${domainList.join(', ')}`, 'yellow');
        process.exit(1);
      }
      
      log(`✅ 证书验证通过，可以使用`, 'green');
    } catch (error) {
      log(`❌ 证书验证失败: ${error.message}`, 'red');
      process.exit(1);
    }
    console.log('');

    // 3. 检查或创建自定义域名
    log('3️⃣  配置自定义域名（边缘优化）...', 'blue');
    
    let domainNameConfig;
    
    try {
      domainNameConfig = await apiGatewayClient.send(new GetDomainNameCommand({
        domainName,
      }));
      log(`✅ 自定义域名已存在`, 'green');
    } catch (error) {
      if (error.name === 'NotFoundException') {
        log('📝 创建边缘优化的自定义域名...', 'yellow');
        
        domainNameConfig = await apiGatewayClient.send(new CreateDomainNameCommand({
          domainName,
          certificateArn,
          endpointConfiguration: {
            types: ['EDGE'], // 边缘优化
          },
        }));
        
        log(`✅ 自定义域名创建成功`, 'green');
      } else {
        throw error;
      }
    }
    
    const cloudFrontDomain = domainNameConfig.distributionDomainName;
    log(`📍 CloudFront 域名: ${cloudFrontDomain}`, 'cyan');
    console.log('');

    // 4. 配置 Base Path Mapping
    log('4️⃣  配置 Base Path Mapping...', 'blue');
    
    try {
      await apiGatewayClient.send(new CreateBasePathMappingCommand({
        domainName,
        restApiId: apiId,
        stage: 'prod',
        basePath: '', // 空字符串表示根路径
      }));
      log(`✅ Base Path Mapping 配置成功`, 'green');
    } catch (error) {
      if (error.name === 'ConflictException') {
        log(`✅ Base Path Mapping 已存在`, 'green');
      } else {
        throw error;
      }
    }
    console.log('');

    // 5. 输出配置信息
    log('🎉 配置完成！', 'green');
    console.log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('📋 DNS 配置信息:', 'blue');
    console.log('');
    log(`请在 Cloudflare DNS 中添加以下 CNAME 记录：`, 'yellow');
    console.log('');
    console.log(`  类型:  CNAME`);
    console.log(`  名称:  api`);
    console.log(`  目标:  ${cloudFrontDomain}`);
    console.log(`  代理:  ❌ 仅 DNS（关闭橙色云朵）`);
    console.log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    console.log('');
    log(`✅ API 端点: https://${domainName}`, 'green');
    log(`✅ 边缘加速: 已启用 (CloudFront)`, 'green');
    console.log('');

    // 输出环境变量
    log('📝 更新以下配置：', 'blue');
    console.log('');
    console.log(`frontend/.env:`);
    console.log(`  NEXT_PUBLIC_API_URL=https://${domainName}`);
    console.log('');
    console.log(`cms/.env:`);
    console.log(`  VITE_API_URL=https://${domainName}`);
    console.log('');
    console.log(`GitHub Secrets:`);
    console.log(`  NEXT_PUBLIC_API_URL=https://${domainName}`);
    console.log(`  VITE_API_URL=https://${domainName}`);
    console.log('');

  } catch (error) {
    log(`❌ 错误: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log('\n');
  log('操作已取消', 'yellow');
  process.exit(0);
});

main();
