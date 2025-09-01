#!/bin/bash
# 部署验证脚本

echo "🚀 开始部署验证..."

# 检查Node版本
node --version

# 检查依赖
npm audit

# 启动测试
echo "🧪 启动服务测试..."
npm start &
PID=$!

sleep 5

# 健康检查
curl -f http://localhost:3000/health

if [ $? -eq 0 ]; then
    echo "✅ 服务启动成功！"
else
    echo "❌ 服务启动失败，请检查日志"
    exit 1
fi

# 清理测试进程
kill $PID

echo "🎉 部署验证完成！"