#!/bin/bash

# Cloudflare Workers手动部署脚本
# 此脚本避免使用wrangler deploy命令，直接通过Web界面部署

echo "=== Cloudflare Workers手动部署脚本 ==="
echo "此脚本将帮助您通过Web界面手动部署RSS推送服务"
echo ""

# 检查必要文件
if [ ! -f "worker.js" ]; then
    echo "错误: 找不到worker.js文件"
    exit 1
fi

if [ ! -f "wrangler.toml" ]; then
    echo "错误: 找不到wrangler.toml文件"
    exit 1
fi

# 读取配置
WORKER_NAME=$(grep "name" wrangler.toml | head -1 | cut -d'"' -f2)
echo "准备部署Worker: $WORKER_NAME"

# 创建部署包
echo "创建部署包..."
DEPLOY_DIR="deploy-package"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 复制必要文件
cp worker.js $DEPLOY_DIR/
cp wrangler.toml $DEPLOY_DIR/

# 创建环境变量配置文件
cat > $DEPLOY_DIR/env-vars.txt << EOF
# 请在Cloudflare Dashboard中设置以下环境变量:

# 必需的环境变量:
CORP_ID=您的企业ID
CORP_SECRET=您的企业应用Secret
AGENT_ID=您的企业应用AgentID
SUPABASE_URL=您的Supabase项目URL
SUPABASE_ANON_KEY=您的Supabase匿名密钥

# 可选的环境变量:
# RSS_CACHE_TTL=缓存时间(秒)
# RSS_MAX_ITEMS=最大RSS条目数
# LOG_LEVEL=日志级别
EOF

# 创建部署说明
cat > $DEPLOY_DIR/README.md << EOF
# RSS推送服务 - Cloudflare Workers手动部署指南

## 步骤1: 登录Cloudflare Dashboard

1. 访问 https://dash.cloudflare.com/
2. 登录您的Cloudflare账户

## 步骤2: 创建新的Worker

1. 在左侧菜单中选择 "Workers & Pages"
2. 点击 "Create Application"
3. 选择 "Workers" 标签
4. 点击 "Create Worker"

## 步骤3: 配置Worker

1. 给Worker命名 (建议使用: $WORKER_NAME)
2. 点击 "Deploy"

## 步骤4: 编辑Worker代码

1. 点击 "Edit code"
2. 删除默认代码
3. 复制并粘贴 worker.js 文件中的全部内容
4. 点击 "Save and Deploy"

## 步骤5: 设置环境变量

1. 在Worker页面中，点击 "Settings" 标签
2. 在左侧菜单中选择 "Variables"
3. 在 "Environment Variables" 部分点击 "Edit variables"
4. 添加 env-vars.txt 文件中列出的所有环境变量
5. 点击 "Save"

## 步骤6: 设置定时任务 (可选)

1. 在 "Settings" 标签中，选择 "Triggers"
2. 在 "Cron Triggers" 部分点击 "Add Cron Trigger"
3. 添加以下Cron表达式 (根据需要):
   - \*/30 * * * * (每30分钟执行一次)
   - 0 */2 * * * (每2小时执行一次)
4. 点击 "Save"

## 步骤7: 测试部署

1. 访问 https://$WORKER_NAME.您的子域名.workers.dev/api/rss
2. 检查是否返回RSS数据

## 完成!

您的RSS推送服务现已部署到Cloudflare Workers。
您可以使用以下URL访问服务:
- https://$WORKER_NAME.您的子域名.workers.dev/api/rss
- https://$WORKER_NAME.您的子域名.workers.dev/api/wechat/callback

如需配置企业微信回调，请将回调URL设置为:
https://$WORKER_NAME.您的子域名.workers.dev/api/wechat/callback
EOF

# 创建ZIP包
cd $DEPLOY_DIR
zip -r ../rss-push-worker.zip .
cd ..

echo "部署包已创建: rss-push-worker.zip"
echo ""
echo "请按照 $DEPLOY_DIR/README.md 中的说明进行手动部署"
echo ""
echo "重要提示:"
echo "1. 请确保在Cloudflare Dashboard中正确设置所有环境变量"
echo "2. 如果需要定时任务，请手动添加Cron触发器"
echo "3. 部署完成后，请测试API端点是否正常工作"
echo ""
echo "部署包位置: $DEPLOY_DIR/"
echo "ZIP包位置: rss-push-worker.zip"