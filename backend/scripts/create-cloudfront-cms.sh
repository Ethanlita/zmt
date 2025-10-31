#!/bin/bash

# CloudFront Distribution 创建脚本 for CMS
# 使用方法: ./create-cloudfront-cms.sh

set -e

echo "================================================"
echo "创建 CloudFront Distribution for CMS"
echo "================================================"

# 配置变量
S3_WEBSITE_ENDPOINT="admin.zunmingtea.com.s3-website-us-east-1.amazonaws.com"
DOMAIN_NAME="admin.zunmingtea.com"
ACM_CERT_ARN="arn:aws:acm:us-east-1:296821242554:certificate/9e69ca45-8c1d-4ae0-b227-96adbcb8d01e"
CALLER_REFERENCE="zmt-cms-$(date +%s)"

# 创建配置文件
cat > /tmp/cloudfront-cms-config.json <<EOF
{
  "CallerReference": "${CALLER_REFERENCE}",
  "Comment": "ZMT CMS Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-Website-${S3_WEBSITE_ENDPOINT}",
        "DomainName": "${S3_WEBSITE_ENDPOINT}",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
          }
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-Website-${S3_WEBSITE_ENDPOINT}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["HEAD", "GET"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["HEAD", "GET"]
      }
    },
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "${ACM_CERT_ARN}",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Aliases": {
    "Quantity": 1,
    "Items": ["${DOMAIN_NAME}"]
  },
  "PriceClass": "PriceClass_All"
}
EOF

echo ""
echo "配置文件已创建: /tmp/cloudfront-cms-config.json"
echo ""
echo "执行以下命令创建 CloudFront Distribution:"
echo ""
echo "aws cloudfront create-distribution --distribution-config file:///tmp/cloudfront-cms-config.json"
echo ""
echo "或者使用 AWS Console 手动创建:"
echo ""
echo "1. 访问: https://console.aws.amazon.com/cloudfront/v3/home#/distributions/create"
echo ""
echo "2. 填写配置:"
echo "   Origin Domain: ${S3_WEBSITE_ENDPOINT}"
echo "   Origin Protocol: HTTP only"
echo "   Viewer Protocol Policy: Redirect HTTP to HTTPS"
echo "   Alternate Domain Names: ${DOMAIN_NAME}"
echo "   SSL Certificate: Custom SSL Certificate → 选择已有证书"
echo "   Default Root Object: index.html"
echo ""
echo "3. 添加 Custom Error Responses:"
echo "   404 → /index.html (200)"
echo "   403 → /index.html (200)"
echo ""
echo "4. 点击 'Create Distribution'"
echo ""
echo "5. 等待 Status 变为 'Deployed' (约 15-20 分钟)"
echo ""
echo "6. 复制 Distribution Domain Name (例如: d123abc.cloudfront.net)"
echo ""
echo "7. 在 Cloudflare 添加 CNAME:"
echo "   名称: admin"
echo "   目标: [刚才复制的 CloudFront 域名]"
echo "   Proxy: 开启 (橙色云)"
echo ""
echo "================================================"
