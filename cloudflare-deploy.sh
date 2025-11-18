#!/bin/bash

# Cloudflare Workers部署脚本
# 用于将RSSHub企业微信推送服务部署到Cloudflare Workers

set -e

echo "开始部署到Cloudflare Workers..."

# 检查是否安装了Wrangler CLI
if ! command -v wrangler &> /dev/null; then
    echo "Wrangler CLI未安装，正在安装..."
    npm install -g wrangler
fi

# 检查是否已登录Cloudflare
echo "检查Cloudflare登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "请先登录Cloudflare账户:"
    wrangler auth
fi

# 设置环境变量
echo "设置环境变量..."
read -p "请输入Supabase URL: " SUPABASE_URL
read -p "请输入Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "请输入Supabase Service Key: " SUPABASE_SERVICE_KEY
read -p "请输入企业微信Corp ID: " WECHAT_CORP_ID
read -p "请输入企业微信Corp Secret: " WECHAT_CORP_SECRET
read -p "请输入企业微信Agent ID: " WECHAT_AGENT_ID
read -p "请输入RSSHub URL (默认: https://rsshub.app): " RSSHUB_URL
RSSHUB_URL=${RSSHUB_URL:-https://rsshub.app}

# 创建KV命名空间
echo "创建KV命名空间..."
KV_NAMESPACE=$(wrangler kv:namespace create "RSS_CACHE" --preview | grep -o 'id = "[^"]*"' | cut -d '"' -f 2)
KV_PREVIEW_NAMESPACE=$(wrangler kv:namespace create "RSS_CACHE" | grep -o 'id = "[^"]*"' | cut -d '"' -f 2)

# 更新wrangler.toml文件中的KV命名空间ID
echo "更新wrangler.toml配置文件..."
sed -i.bak "s/your-kv-namespace-id/$KV_NAMESPACE/g" wrangler.toml
sed -i.bak "s/your-preview-kv-namespace-id/$KV_PREVIEW_NAMESPACE/g" wrangler.toml

# 设置环境变量
echo "配置环境变量..."
wrangler secret put SUPABASE_URL <<< $SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY <<< $SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_KEY <<< $SUPABASE_SERVICE_KEY
wrangler secret put WECHAT_CORP_ID <<< $WECHAT_CORP_ID
wrangler secret put WECHAT_CORP_SECRET <<< $WECHAT_CORP_SECRET
wrangler secret put WECHAT_AGENT_ID <<< $WECHAT_AGENT_ID
wrangler secret put RSSHUB_URL <<< $RSSHUB_URL

# 部署到Cloudflare Workers
echo "部署到Cloudflare Workers..."
wrangler deploy

echo "部署完成！"
echo "您的服务已部署到Cloudflare Workers"
echo "您可以通过以下URL访问您的服务:"
wrangler whoami
echo ""
echo "注意：请确保您的企业微信应用配置了正确的回调URL"