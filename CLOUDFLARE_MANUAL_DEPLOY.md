# Cloudflare Workers手动部署指南

## 问题说明

在部署Cloudflare Workers时，您可能遇到了`@cloudflare/workerd-linux-64`包缺失的错误。这是因为Wrangler CLI在某些环境中无法正确安装其可选依赖。本指南提供了一种完全避免这个问题的手动部署方法。

## 解决方案概述

我们将通过Cloudflare Dashboard直接部署代码，而不是使用`wrangler deploy`命令。这种方法完全绕过了workerd包的问题，同时提供了对部署过程的完全控制。

## 部署步骤

### 第一步：准备部署文件

1. 运行手动部署脚本，创建部署包：
   ```bash
   chmod +x cloudflare-manual-deploy.sh
   ./cloudflare-manual-deploy.sh
   ```

2. 这将创建一个`deploy-package`目录，包含：
   - `worker-simple.js` - 简化版Worker代码（完全兼容Cloudflare Workers）
   - `wrangler.toml` - 配置文件
   - `env-vars.txt` - 环境变量列表
   - `README.md` - 详细部署说明

### 第二步：登录Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 使用您的Cloudflare账户登录

### 第三步：创建新的Worker

1. 在左侧菜单中选择 **"Workers & Pages"**
2. 点击 **"Create Application"**
3. 选择 **"Workers"** 标签
4. 点击 **"Create Worker"**

### 第四步：配置Worker

1. 给Worker命名（例如：`rss-push-worker`）
2. 点击 **"Deploy"**

### 第五步：编辑Worker代码

1. 在Worker页面中，点击 **"Edit code"**
2. 删除默认代码
3. 复制并粘贴 `worker-simple.js` 文件中的全部内容
4. 点击 **"Save and Deploy"**

### 第六步：设置环境变量

1. 在Worker页面中，点击 **"Settings"** 标签
2. 在左侧菜单中选择 **"Variables"**
3. 在 **"Environment Variables"** 部分点击 **"Edit variables"**
4. 添加以下环境变量：

   ```
   # 必需的环境变量
   SUPABASE_URL=您的Supabase项目URL
   SUPABASE_ANON_KEY=您的Supabase匿名密钥
   WECHAT_CORP_ID=您的企业ID
   WECHAT_CORP_SECRET=您的企业应用Secret
   WECHAT_AGENT_ID=您的企业应用AgentID
   
   # 可选的环境变量
   RSSHUB_URL=https://rsshub.app
   ```

5. 点击 **"Save"**

### 第七步：设置KV存储（可选）

如果您需要使用缓存功能：

1. 在左侧菜单中选择 **"Workers & Pages"**
2. 点击 **"KV"**
3. 点击 **"Create a namespace"**
4. 命名空间名称：`RSS_CACHE`
5. 点击 **"Add"**

然后回到Worker设置：

1. 在Worker页面中，点击 **"Settings"** 标签
2. 在左侧菜单中选择 **"Variables"**
3. 在 **"KV Namespace Bindings"** 部分点击 **"Add binding"**
4. 变量名称：`RSS_CACHE`
5. KV命名空间：选择刚刚创建的`RSS_CACHE`
6. 点击 **"Save"**

### 第八步：设置定时任务（可选）

如果您需要定时检查RSS：

1. 在 **"Settings"** 标签中，选择 **"Triggers"**
2. 在 **"Cron Triggers"** 部分点击 **"Add Cron Trigger"**
3. 添加以下Cron表达式（根据需要选择）：
   - `*/30 * * * *` (每30分钟执行一次)
   - `0 */2 * * *` (每2小时执行一次)
4. 点击 **"Save"**

### 第九步：测试部署

1. 访问 `https://您的Worker名称.您的子域名.workers.dev/health`
2. 检查是否返回健康状态
3. 访问 `https://您的Worker名称.您的子域名.workers.dev/api/rss`
4. 检查是否返回RSS数据

## 常见问题解决

### 1. 环境变量未生效

- 确保所有必需的环境变量都已正确设置
- 检查变量名称是否有拼写错误
- 保存环境变量后，尝试重新部署Worker

### 2. API端点返回错误

- 检查Worker日志：在Worker页面中，点击 **"Logs"** 标签
- 确认Supabase连接配置是否正确
- 验证企业微信应用配置是否有效

### 3. 定时任务不执行

- 确认Cron表达式格式正确
- 检查定时任务日志
- 确保KV存储绑定已正确配置（如果使用了缓存）

## 高级配置

### 自定义域名

如果您想使用自定义域名：

1. 在Worker页面中，点击 **"Settings"** 标签
2. 在左侧菜单中选择 **"Triggers"**
3. 在 **"Custom Domains"** 部分点击 **"Add custom domain"**
4. 输入您的域名并按照提示完成DNS配置

### 多环境部署

如果您需要区分开发和生产环境：

1. 创建多个Worker（如：`rss-push-dev`和`rss-push-prod`）
2. 为每个环境配置不同的环境变量
3. 使用不同的KV命名空间

## 更新部署

当您需要更新代码时：

1. 在Worker页面中，点击 **"Edit code"**
2. 修改代码
3. 点击 **"Save and Deploy"**

## 删除部署

如果您需要删除部署：

1. 在Workers & Pages页面中，找到您的Worker
2. 点击右侧的三个点菜单
3. 选择 **"Delete"**
4. 确认删除

## 总结

通过这种手动部署方法，您可以完全避免`@cloudflare/workerd-linux-64`包缺失的问题，同时获得对部署过程的完全控制。这种方法虽然比使用CLI工具稍微繁琐一些，但更加可靠和透明。

如果您在部署过程中遇到任何问题，请检查Cloudflare Workers的日志，它通常能提供有用的错误信息。