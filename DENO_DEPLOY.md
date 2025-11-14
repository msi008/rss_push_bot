# Deno部署指南

## 问题说明

在Deno部署环境中，`better-sqlite3`包需要编译原生模块，但缺少Python环境，导致部署失败。

## 解决方案

### 方案一：使用环境变量配置Python路径

在Deno部署时设置以下环境变量：

```bash
# 设置Python环境变量
export PYTHON=/usr/bin/python3

# 设置npm配置
npm config set python "/usr/bin/python3"

# 设置node-gyp配置
export npm_config_python="/usr/bin/python3"
```

### 方案二：使用Deno配置文件

项目已包含`deno.json`和`deno.jsonc`配置文件，用于处理原生模块问题。

### 方案三：使用项目提供的脚本

```bash
# 安装依赖（使用Python3）
npm run deno:install

# 启动应用
npm run deno:start
```

## 部署步骤

1. 在Deno部署平台设置环境变量：
   - `PYTHON=/usr/bin/python3`
   - `npm_config_python=/usr/bin/python3`

2. 使用项目提供的部署脚本或配置文件

3. 如果仍有问题，可以考虑替换`better-sqlite3`依赖为纯JavaScript实现

## 注意事项

- `better-sqlite3`是通过`@follow-app/client-sdk`间接引入的
- 如果不需要SQLite功能，可以考虑移除`@follow-app/client-sdk`依赖
- Deno部署平台可能需要额外的配置来支持原生模块编译

## 替代方案

如果上述方法无效，可以考虑以下替代方案：

1. 使用Docker部署，确保包含Python和编译工具
2. 使用支持原生模块的云平台（如Vercel、Heroku等）
3. 替换`better-sqlite3`为纯JavaScript数据库实现（如`sqlite3`的JavaScript版本）