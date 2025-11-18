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

1. 给Worker命名 (建议使用: rsshub-enterprise-wechat-bot)
2. 点击 "Deploy"

## 步骤4: 编辑Worker代码

1. 点击 "Edit code"
2. 删除默认代码
3. 复制并粘贴 worker-simple.js 文件中的全部内容 (注意：使用worker-simple.js而不是worker.js)
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

1. 访问 https://rsshub-enterprise-wechat-bot.您的子域名.workers.dev/api/rss
2. 检查是否返回RSS数据

## 完成!

您的RSS推送服务现已部署到Cloudflare Workers。
您可以使用以下URL访问服务:
- https://rsshub-enterprise-wechat-bot.您的子域名.workers.dev/api/rss
- https://rsshub-enterprise-wechat-bot.您的子域名.workers.dev/api/wechat/callback

如需配置企业微信回调，请将回调URL设置为:
https://rsshub-enterprise-wechat-bot.您的子域名.workers.dev/api/wechat/callback
