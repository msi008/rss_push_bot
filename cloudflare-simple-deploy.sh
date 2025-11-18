#!/bin/bash

# 简化的Cloudflare Workers部署脚本
# 用于将RSSHub企业微信推送服务部署到Cloudflare Workers

set -e

echo "开始简化部署到Cloudflare Workers..."

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

# 创建简化的wrangler.toml文件
echo "创建简化的wrangler.toml配置文件..."
cat > wrangler.toml << 'EOF'
name = "rsshub-enterprise-wechat-bot"
main = "worker.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
# 这些变量需要在部署后通过Cloudflare Dashboard设置
EOF

# 部署到Cloudflare Workers
echo "部署到Cloudflare Workers..."
wrangler deploy

echo ""
echo "部署完成！"
echo ""
echo "下一步操作："
echo "1. 访问Cloudflare Dashboard: https://dash.cloudflare.com/"
echo "2. 进入Workers & Pages"
echo "3. 选择 rsshub-enterprise-wechat-bot"
echo "4. 点击 'Settings' -> 'Variables'"
echo "5. 添加以下环境变量："
echo "   - SUPABASE_URL (您的Supabase项目URL)"
echo "   - SUPABASE_ANON_KEY (您的Supabase匿名密钥)"
echo "   - SUPABASE_SERVICE_KEY (您的Supabase服务密钥)"
echo "   - WECHAT_CORP_ID (您的企业微信企业ID)"
echo "   - WECHAT_CORP_SECRET (您的企业微信应用密钥)"
echo "   - WECHAT_AGENT_ID (您的企业微信应用ID)"
echo "   - RSSHUB_URL (可选，默认为https://rsshub.app)"
echo ""
echo "6. 如果需要KV存储，请在Workers设置中添加KV命名空间"
echo "7. 如果需要定时任务，请在Workers设置中添加Cron Triggers"
echo ""
echo "您的服务已部署到Cloudflare Workers，可以通过以下URL访问："
wrangler whoami