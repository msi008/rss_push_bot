# Cloudflare Workers 部署指南

本指南将帮助您将RSSHub企业微信推送服务部署到Cloudflare Workers平台。

## 准备工作

1. 注册Cloudflare账户：[https://www.cloudflare.com/](https://www.cloudflare.com/)
2. 安装Node.js和npm
3. 注册Supabase账户并创建项目（用于数据存储）
4. 准备企业微信应用凭证（Corp ID、Corp Secret、Agent ID）

## 部署步骤

### 方法一：使用自动部署脚本（推荐）

1. 克隆项目到本地：
   ```bash
   git clone [项目仓库地址]
   cd rss_push
   ```

2. 运行部署脚本：
   ```bash
   chmod +x cloudflare-deploy.sh
   ./cloudflare-deploy.sh
   ```

3. 按照提示输入必要的环境变量：
   - Supabase URL
   - Supabase Anon Key
   - Supabase Service Key
   - 企业微信Corp ID
   - 企业微信Corp Secret
   - 企业微信Agent ID
   - RSSHub URL（可选，默认为https://rsshub.app）

### 方法二：手动部署

1. 安装Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```

2. 登录Cloudflare：
   ```bash
   wrangler auth
   ```

3. 创建KV命名空间：
   ```bash
   wrangler kv:namespace create "RSS_CACHE"
   wrangler kv:namespace create "RSS_CACHE" --preview
   ```

4. 更新`wrangler.toml`文件中的KV命名空间ID

5. 设置环境变量：
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_ANON_KEY
   wrangler secret put SUPABASE_SERVICE_KEY
   wrangler secret put WECHAT_CORP_ID
   wrangler secret put WECHAT_CORP_SECRET
   wrangler secret put WECHAT_AGENT_ID
   wrangler secret put RSSHUB_URL
   ```

6. 部署到Cloudflare Workers：
   ```bash
   wrangler deploy
   ```

## 配置企业微信回调

1. 登录企业微信管理后台
2. 找到您的应用，设置可信域名
3. 配置回调URL为您的Cloudflare Workers地址
4. 设置消息接收URL为：`https://your-worker-url.workers.dev/api/wechat/callback`

## 环境变量说明

| 变量名 | 描述 | 必需 |
|--------|------|------|
| SUPABASE_URL | Supabase项目URL | 是 |
| SUPABASE_ANON_KEY | Supabase匿名访问密钥 | 是 |
| SUPABASE_SERVICE_KEY | Supabase服务密钥 | 是 |
| WECHAT_CORP_ID | 企业微信企业ID | 是 |
| WECHAT_CORP_SECRET | 企业微信应用密钥 | 是 |
| WECHAT_AGENT_ID | 企业微信应用ID | 是 |
| RSSHUB_URL | RSSHub服务地址 | 否，默认为https://rsshub.app |

## 定时任务配置

项目已配置定时任务，每6小时检查一次RSS更新。您可以在`wrangler.toml`文件中修改`crons`表达式来调整执行频率。

## 常见问题

### 1. 部署失败

- 检查环境变量是否正确设置
- 确保Supabase项目已创建且配置正确
- 检查企业微信应用凭证是否有效

### 2. 定时任务不执行

- 确保KV命名空间已正确创建
- 检查`wrangler.toml`中的cron表达式格式
- 在Cloudflare Dashboard中检查Cron Triggers状态

### 3. 企业微信回调失败

- 确保回调URL已正确配置
- 检查企业微信应用权限设置
- 查看Cloudflare Workers日志获取详细错误信息

## 监控和日志

1. 在Cloudflare Dashboard中查看Workers日志
2. 使用`wrangler tail`命令实时查看日志：
   ```bash
   wrangler tail
   ```

## 更新部署

1. 修改代码后，运行：
   ```bash
   wrangler deploy
   ```

2. 如需更新环境变量：
   ```bash
   wrangler secret put VARIABLE_NAME
   ```

## 删除部署

如需删除部署：
```bash
wrangler delete
```

## 注意事项

1. Cloudflare Workers有请求执行时间限制（50ms CPU时间）
2. 免费版有每日请求次数限制
3. 定时任务在免费版有执行频率限制
4. 确保代码符合Cloudflare Workers的安全策略

## 更多资源

- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)
- [Supabase文档](https://supabase.com/docs)