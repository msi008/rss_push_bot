# Cloudflare Workers 部署指南

本指南将帮助您将RSSHub企业微信推送服务部署到Cloudflare Workers平台。

## 准备工作

1. 注册Cloudflare账户：[https://www.cloudflare.com/](https://www.cloudflare.com/)
2. 安装Node.js和npm
3. 注册Supabase账户并创建项目（用于数据存储）
4. 准备企业微信应用凭证（Corp ID、Corp Secret、Agent ID）

## 部署步骤

### 方法一：使用简化部署脚本（推荐）

1. 克隆项目到本地：
   ```bash
   git clone [项目仓库地址]
   cd rss_push
   ```

2. 运行简化部署脚本：
   ```bash
   chmod +x cloudflare-simple-deploy.sh
   ./cloudflare-simple-deploy.sh
   ```

3. 按照脚本输出中的说明，在Cloudflare Dashboard中配置环境变量

### 方法二：使用完整部署脚本

1. 运行完整部署脚本：
   ```bash
   chmod +x cloudflare-deploy.sh
   ./cloudflare-deploy.sh
   ```

2. 按照提示输入必要的环境变量：
   - Supabase URL
   - Supabase Anon Key
   - Supabase Service Key
   - 企业微信Corp ID
   - 企业微信Corp Secret
   - 企业微信Agent ID
   - RSSHub URL（可选，默认为https://rsshub.app）

### 方法三：手动部署

1. 安装Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```

2. 登录Cloudflare：
   ```bash
   wrangler auth
   ```

3. 创建KV命名空间（可选）：
   ```bash
   wrangler kv:namespace create "RSS_CACHE"
   wrangler kv:namespace create "RSS_CACHE" --preview
   ```

4. 更新`wrangler.toml`文件中的KV命名空间ID（如果使用）

5. 部署到Cloudflare Workers：
   ```bash
   wrangler deploy
   ```

6. 在Cloudflare Dashboard中设置环境变量

## 常见部署问题及解决方案

### 1. 错误：The package "@cloudflare/workerd-linux-64" could not be found

这个错误通常是由于wrangler版本与Cloudflare Workers环境不兼容导致的。解决方案：

1. 使用简化部署脚本（推荐）
2. 或者更新wrangler.toml配置文件：
   ```toml
   compatibility_date = "2024-01-01"
   compatibility_flags = ["nodejs_compat"]
   ```
   删除`node_compat = true`行

### 2. 部署失败：内存不足或超时

1. 简化worker.js代码，移除不必要的依赖
2. 使用Cloudflare Dashboard手动设置环境变量，而不是通过命令行

### 3. 定时任务不执行

1. 在Cloudflare Dashboard中手动添加Cron Triggers
2. 确保KV命名空间已正确创建并绑定

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

## 在Cloudflare Dashboard中配置环境变量

1. 登录Cloudflare Dashboard
2. 进入Workers & Pages
3. 选择您的Worker
4. 点击"Settings" -> "Variables"
5. 添加环境变量

## 定时任务配置

项目支持定时任务，每6小时检查一次RSS更新。您可以通过以下方式配置：

1. 在Cloudflare Dashboard中添加Cron Triggers
2. 或在wrangler.toml中添加：
   ```toml
   [[triggers]]
   crons = ["0 */6 * * *"]  # 每6小时运行一次
   ```

## KV存储配置（可选）

如果需要使用KV存储进行缓存：

1. 在Cloudflare Dashboard中创建KV命名空间
2. 在Worker设置中绑定KV命名空间
3. 绑定名称为"RSS_CACHE"

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

2. 如需更新环境变量，在Cloudflare Dashboard中修改

## 删除部署

如需删除部署：
```bash
wrangler delete
```

## 注意事项

1. Cloudflare Workers有请求执行时间限制（50ms CPU时间，免费版10ms）
2. 免费版有每日请求次数限制（100,000次/天）
3. 定时任务在免费版有执行频率限制
4. 确保代码符合Cloudflare Workers的安全策略
5. 避免使用Node.js特定的API，使用Web标准API

## 更多资源

- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI文档](https://developers.cloudflare.com/workers/wrangler/)
- [Supabase文档](https://supabase.com/docs)
- [Cloudflare Workers兼容性](https://developers.cloudflare.com/workers/learning/how-workers-works/)