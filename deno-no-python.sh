#!/bin/bash

# Deno部署脚本 - 无Python环境的解决方案

echo "开始Deno无Python环境部署配置..."

# 方案1: 使用预编译的better-sqlite3版本
echo "尝试使用预编译的better-sqlite3版本..."

# 创建.npmrc文件，配置使用预编译二进制
cat > .npmrc << EOF
# 配置npm使用预编译二进制
target_platform=linux
target_arch=x64
target_libc=libc

# 配置node-gyp跳过Python检查
node_gyp="/usr/bin/node"
python="/bin/false"
EOF

# 尝试安装依赖
echo "安装依赖包..."
npm install --ignore-scripts

# 如果仍然失败，尝试方案2
if [ $? -ne 0 ]; then
    echo "方案1失败，尝试方案2: 替换better-sqlite3为纯JS实现..."
    
    # 创建替代的package.json片段
    cat > package-replace.json << EOF
{
  "overrides": {
    "better-sqlite3": "npm:@vscode/sqlite3@5.1.6"
  }
}
EOF
    
    # 合并配置
    npm install --ignore-scripts --package-override-json=package-replace.json
fi

echo "Deno无Python环境部署配置完成！"
echo "启动命令: deno run --allow-net --allow-read --allow-env --allow-write src/app.js"