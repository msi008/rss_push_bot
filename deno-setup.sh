#!/bin/bash

# Deno部署脚本 - 解决better-sqlite3原生模块编译问题

echo "开始Deno部署配置..."

# 检查Python是否可用
if command -v python3 &> /dev/null; then
    echo "找到Python3: $(python3 --version)"
    export PYTHON=$(which python3)
    export npm_config_python=$(which python3)
    npm config set python $(which python3)
else
    echo "错误: 未找到Python3，请先安装Python3"
    exit 1
fi

# 安装依赖
echo "安装依赖包..."
npm install --python=$(which python3)

# 如果部署失败，尝试使用node-gyp重建
if [ $? -ne 0 ]; then
    echo "依赖安装失败，尝试重建原生模块..."
    
    # 安装node-gyp依赖
    npm install -g node-gyp
    
    # 重建better-sqlite3
    cd node_modules/better-sqlite3
    node-gyp rebuild --python=$(which python3)
    cd ../..
fi

echo "Deno部署配置完成！"
echo "启动命令: deno run --allow-net --allow-read --allow-env --allow-write src/app.js"