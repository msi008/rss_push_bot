#!/bin/bash

# 🚀 RSS推送服务 快速启动脚本
# 一键测试配置和服务状态

echo "🎯 RSS推送服务快速启动"
echo "========================"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 备份并创建示例.env文件
if [ ! -f ".env" ]; then
    echo "⚙️  创建.env配置示例..."
    cat > .env << 'EOF'
# 服务配置
PORT=3000
NODE_ENV=development

# RSS订阅源配置（示例）
RSS_FEEDS=[
  {"name":"36氪热门","url":"rsshub://36kr/hot-list","type":"rsshub"},
  {"name":"知乎热榜","url":"rsshub://zhihu/hot","type":"rsshub"}
]

# 邮件通知配置
ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_USER=your_email@qq.com
SMTP_PASS=your_smtp_password

# 企业微信Webhook（必须配置）
WX_ROBOT_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_WEBHOOK_KEY

# RSSHub配置
BASE_URL=https://rsshub.app
TIMEZONE=Asia/Shanghai

# 定时任务配置
CRON_EXPRESSION=0 */4 * * *
FETCH_TIMEOUT=30000

# RSS配置
FEED_FETCH_COUNT=20
MAX_RETENTION_DAYS=7
EOF
    echo "✅ .env文件已创建，请填写必要配置"
fi

# 检查配置中的Webhook key
if grep -q "YOUR_WEBHOOK_KEY" .env; then
    echo "⚠️  请先编辑.env文件填写企业微信Webhook密钥"
    echo "否则推送功能将无法使用"
fi

# 启动服务
echo "🚀 启动RSS服务..."
npm run dev &
SERVICE_PID=$!

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 健康检查
echo "🔍 测试健康检查..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/rss/health 2>/dev/null || echo "000")

if [ "$RESPONSE" = "200" ]; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "📋 可用API："
    echo "  - 获取文章: http://localhost:3000/api/rss/articles"
    echo "  - 健康检查: http://localhost:3000/api/rss/health"
    echo "  - 推送测试: curl -X POST http://localhost:3000/api/rss/push"
    echo ""
    echo "📖 查看完整使用指南: API_USAGE_GUIDE.md"
else
    echo "❌ 服务启动失败，请检查："
    echo "  1. 端口3000是否被占用"
    echo "  2. .env文件配置是否正确"
    echo "  3. 依赖是否正确安装"
fi

echo ""
echo "🎮 测试命令："
echo "  curl http://localhost:3000/api/rss/health"
echo "  curl http://localhost:3000/api/rss/articles"
echo ""
echo "按 Ctrl+C 停止服务"

# 保持脚本运行，直到用户停止
wait $SERVICE_PID