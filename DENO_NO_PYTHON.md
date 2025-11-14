# Deno无Python环境部署解决方案

## 问题描述

在Deno部署环境中，`better-sqlite3`包需要编译原生模块，但缺少Python环境，导致部署失败。

## 解决方案

### 方案一：使用预编译二进制（推荐）

1. 创建`.npmrc`文件，配置使用预编译二进制：

```ini
# 配置npm使用预编译二进制
target_platform=linux
target_arch=x64
target_libc=libc

# 配置node-gyp跳过Python检查
node_gyp="/usr/bin/node"
python="/bin/false"
```

2. 安装依赖时跳过脚本：

```bash
npm install --ignore-scripts
```

### 方案二：替换原生依赖

在`package.json`中使用`overrides`字段替换`better-sqlite3`：

```json
{
  "overrides": {
    "better-sqlite3": "npm:@vscode/sqlite3@5.1.6"
  }
}
```

### 方案三：使用项目提供的脚本

```bash
# 使用无Python环境部署脚本
./deno-no-python.sh

# 或者使用修改后的package.json
cp package-deno.json package.json
npm install --ignore-scripts
```

## 部署步骤

1. **选择合适的解决方案**（推荐方案一）

2. **在Deno部署平台设置环境变量**：
   ```
   NPM_CONFIG_IGNORE_SCRIPTS=true
   NPM_CONFIG_TARGET_PLATFORM=linux
   NPM_CONFIG_TARGET_ARCH=x64
   NPM_CONFIG_TARGET_LIBC=libc
   ```

3. **部署应用**：
   ```bash
   deno run --allow-net --allow-read --allow-env --allow-write src/app.js
   ```

## 注意事项

1. **功能影响**：替换`better-sqlite3`可能会影响某些功能，特别是如果您的代码直接使用了SQLite数据库

2. **测试验证**：部署后请测试所有功能，确保没有因替换依赖而导致的问题

3. **性能考虑**：纯JavaScript实现的SQLite可能比原生实现慢，但对于大多数应用场景影响不大

## 替代方案

如果上述方法仍然无效：

1. **使用Docker部署**：创建包含Python环境的Docker镜像
2. **更换部署平台**：使用支持原生模块的云平台（如Vercel、Heroku等）
3. **移除相关依赖**：如果不需要SQLite功能，可以考虑移除`@follow-app/client-sdk`依赖

## 故障排除

如果仍然遇到问题，请检查：

1. 确保所有环境变量设置正确
2. 检查Deno部署平台是否支持npm overrides
3. 查看完整的错误日志，确定具体是哪个包导致的问题

## 相关文件

- `deno-no-python.sh` - 无Python环境部署脚本
- `package-deno.json` - 修改后的package.json，包含依赖替换
- `.npmrc` - npm配置文件（由脚本自动生成）