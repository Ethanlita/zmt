#!/bin/bash

# AWS Amplify CMS 部署脚本
# 使用方法: ./deploy-amplify-cms.sh

set -e

echo "================================================"
echo "部署 CMS 到 AWS Amplify"
echo "================================================"

# 配置变量
APP_NAME="zmt-cms"
REPO_URL="https://github.com/Ethanlita/zmt"
BRANCH="main"
DOMAIN_NAME="admin.zunmingtea.com"
REGION="us-east-1"

echo ""
echo "步骤 1: 创建 Amplify App"
echo "------------------------------------------------"

# 检查 App 是否已存在
APP_ID=$(aws amplify list-apps --region ${REGION} --query "apps[?name=='${APP_NAME}'].appId" --output text 2>/dev/null || echo "")

if [ -z "$APP_ID" ]; then
  echo "创建新的 Amplify App..."
  
  APP_ID=$(aws amplify create-app \
    --name "${APP_NAME}" \
    --repository "${REPO_URL}" \
    --platform WEB \
    --region ${REGION} \
    --environment-variables \
      VITE_API_URL=https://api.zunmingtea.com \
      VITE_COGNITO_USER_POOL_ID=us-east-1_T7MyJyPr0 \
      VITE_COGNITO_CLIENT_ID=3l2enft1vanfn7l0e27b88j9gr \
      VITE_COGNITO_REGION=us-east-1 \
      VITE_COGNITO_DOMAIN=zmt-auth \
      VITE_COGNITO_LOGIN_URL="https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/login?client_id=3l2enft1vanfn7l0e27b88j9gr&response_type=token&scope=openid&redirect_uri=https://admin.zunmingtea.com" \
      VITE_COGNITO_LOGOUT_URL="https://us-east-1t7myjypr0.auth.us-east-1.amazoncognito.com/logout?client_id=3l2enft1vanfn7l0e27b88j9gr&logout_uri=https://admin.zunmingtea.com" \
    --build-spec "$(cat cms/amplify.yml)" \
    --custom-rules \
      '[{"source":"</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>","target":"/index.html","status":"200"}]' \
    --query 'app.appId' \
    --output text)
  
  echo "✅ Amplify App 创建成功: ${APP_ID}"
else
  echo "✅ Amplify App 已存在: ${APP_ID}"
fi

echo ""
echo "步骤 2: 连接 GitHub 分支"
echo "------------------------------------------------"

# 检查分支是否已连接
BRANCH_EXISTS=$(aws amplify list-branches \
  --app-id "${APP_ID}" \
  --region ${REGION} \
  --query "branches[?branchName=='${BRANCH}'].branchName" \
  --output text 2>/dev/null || echo "")

if [ -z "$BRANCH_EXISTS" ]; then
  echo "连接 ${BRANCH} 分支..."
  
  aws amplify create-branch \
    --app-id "${APP_ID}" \
    --branch-name "${BRANCH}" \
    --region ${REGION} \
    --enable-auto-build \
    --framework "React"
  
  echo "✅ 分支连接成功"
else
  echo "✅ 分支已连接"
fi

echo ""
echo "步骤 3: 配置自定义域名"
echo "------------------------------------------------"

# 添加自定义域名
echo "添加域名 ${DOMAIN_NAME}..."

aws amplify create-domain-association \
  --app-id "${APP_ID}" \
  --domain-name "zunmingtea.com" \
  --sub-domain-settings \
    "prefix=admin,branchName=${BRANCH}" \
  --region ${REGION} 2>/dev/null || echo "域名可能已存在"

echo "✅ 域名配置已提交"

echo ""
echo "步骤 4: 启动构建"
echo "------------------------------------------------"

aws amplify start-job \
  --app-id "${APP_ID}" \
  --branch-name "${BRANCH}" \
  --job-type RELEASE \
  --region ${REGION}

echo "✅ 构建已启动"

echo ""
echo "================================================"
echo "部署配置完成！"
echo "================================================"
echo ""
echo "Amplify App ID: ${APP_ID}"
echo "App URL: https://${BRANCH}.${APP_ID}.amplifyapp.com"
echo "自定义域名: https://${DOMAIN_NAME}"
echo ""
echo "请执行以下操作："
echo ""
echo "1. 在 Amplify Console 查看构建状态："
echo "   https://console.aws.amazon.com/amplify/home?region=${REGION}#/${APP_ID}"
echo ""
echo "2. 等待域名 SSL 证书验证（约 15-30 分钟）"
echo ""
echo "3. 在 Cloudflare 添加 CNAME 记录（Amplify 会提供）："
echo "   类型: CNAME"
echo "   名称: admin"
echo "   目标: [从 Amplify Console 复制]"
echo "   Proxy: 关闭 (DNS Only)"
echo ""
echo "4. 更新 Cognito App Client 回调 URL："
echo "   https://admin.zunmingtea.com"
echo ""
echo "================================================"
