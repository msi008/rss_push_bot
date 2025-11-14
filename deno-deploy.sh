# Deno部署配置
# 解决better-sqlite3原生模块编译问题

# 设置Python环境变量
export PYTHON=/usr/bin/python3

# 设置npm配置
npm config set python "/usr/bin/python3"

# 设置node-gyp配置
export npm_config_python="/usr/bin/python3"

# 安装依赖
npm install

# 启动应用
deno task start