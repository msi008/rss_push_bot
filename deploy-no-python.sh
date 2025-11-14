#!/bin/bash

# 不依赖Python的部署脚本
# 适用于Deno部署环境或没有Python环境的系统

set -e

echo "=========================================="
echo "RSS推送服务 - 不依赖Python部署脚本"
echo "=========================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm未安装，请先安装npm"
    exit 1
fi

echo "1. 备份原始package.json"
if [ -f "package.json" ]; then
    cp package.json package.json.backup
    echo "已备份原始package.json到package.json.backup"
fi

echo "2. 使用不依赖Python的package.json"
cp package-no-python.json package.json
echo "已替换package.json为不依赖Python版本"

echo "3. 配置npm跳过原生模块编译"
cat > .npmrc << EOF
# 跳过原生模块编译
ignore-scripts=true
# 不下载可选依赖
optional=false
# 使用预编译二进制
target_platform=linux
target_arch=x64
target_libc=unknown
EOF

echo "4. 安装依赖（跳过脚本执行）"
npm install --ignore-scripts --no-optional

echo "5. 检查安装结果"
if [ -d "node_modules" ]; then
    echo "依赖安装成功"
else
    echo "错误: 依赖安装失败"
    exit 1
fi

echo "6. 创建启动脚本"
cat > start-no-python.sh << EOF
#!/bin/bash
# 不依赖Python的启动脚本
export NODE_ENV=production
node src/app.js
EOF

chmod +x start-no-python.sh

echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo "启动方式："
echo "1. 直接运行: ./start-no-python.sh"
echo "2. 手动运行: node src/app.js"
echo "3. 使用npm: npm start"
echo ""
echo "注意：此版本已移除@follow-app/client-sdk依赖，"
echo "直接使用fetch API获取RSS数据，无需Python环境。"