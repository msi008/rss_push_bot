# 🎯 RSS推送服务使用指南

## ❗ 重要提醒

**错误示范**：`GET /36kr/hot-list` ❌（这个路径不存在）

**正确方式**：配置RSSFeeds后通过API获取内容 ✅

## 🚀 正确的服务架构

```
用户浏览器  ←→  本地API服务  ←→  RSSHub(https://rsshub.app)  ←→  36kr/hot-list
         │          │                    │                     │
    访问API      本地获取      请求RSSHub数据      返回最新文章
```

## 📋 使用步骤

### 1. 配置RSS源（.env文件）

```bash
cd /Users/mac/crawl4AI/rss_push

# 编辑.env文件
cat > .env << 'EOF'
# 服务配置
PORT=3000
NODE_ENV=development

# RSS配置
RSS_FEEDS=[
  {"name":"36氪热门","url":"rsshub://36kr/hot-list","type":"rsshub"},
  {"name":"知乎热榜","url":"rsshub://zhihu/hot","type":"rsshub"},
  {"name":"科技新闻","url":"https://feed.infoq.com/cn/","type":"rss"}
]

# 企业微信配置（需要填写实际信息）
WX_ROBOT_WEBHOOK=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=your_key_here

# RSSHub配置
BASE_URL=https://rsshub.app
TIMEZONE=Asia/Shanghai
EOF
```

### 2. 启动服务

```bash
npm run dev
```

### 3. 测试RSS功能

#### 选项A：获取最新文章
```bash
curl http://localhost:3000/api/rss/articles
```
**返回**：所有配置源的最新RSS文章列表

#### 选项B：健康检查【推荐】
```bash
curl http://localhost:3000/api/rss/health
```
**返回**：各RSS源的获取状态

#### 选项C：浏览器访问
访问：`http://localhost:3000/api/rss/articles`

### 4. 自动推送设置

#### 手动推送测试
```bash
curl -X POST http://localhost:3000/api/rss/push
```

#### 定时推送（自动启用）
任务会每4小时自动执行
日志位置：`logs/combined.log`

## 🔍 调试指南

### 检查日志
```bash
# 查看最新日志
tail -f logs/combined.log

# 排查错误日志
tail -f logs/error.log
```

### 测试RSSURL

我已经为您准备了一个测试脚本：

```bash
node /Users/mac/crawl4AI/rss_push/src/test_rsshub.js
```

**预期输出**：
```
测试RSSHub协议适配：
╦═══════════════════════════════╦════════════════════════════════╗
╠ rsshub://36kr/hot-list        ║ https://rsshub.app/36kr/hot-list ║
╚═══════════════════════════════╩════════════════════════════════╝
```

## 🎯 配置更多源

添加更多RSS支持的三种格式：

```bash
RSS_FEEDS=[
  {"name":"36氪","url":"rsshub://36kr/hot-list","type":"rsshub"},
  {"name":"知乎","url":"rsshub://zhihu/hot","type":"rsshub"},
  {"name":"GitHub热门","url":"rsshub://github/trending/daily","type":"rsshub"},
  {"name":"RSSHub路由","url":"/bilibili/ranking/0","type":"rsshub"},
  {"name":"传统RSS","url":"https://news.ycombinator.com/rss","type":"rss"}
]
```

## ⚡ 快速验证

**一键测试**：
```bash
# 1. 启动服务
npm run dev &

# 2. 测试连接
curl -s http://localhost:3000/api/rss/health | jq .

# 3. 查看文章
curl -s http://localhost:3000/api/rss/articles | jq '.[].title' | head -5
```

## ❓ 常见问题

1. **Q: 404错误如何解？**
   A: 必须使用API路径 `/api/rss/articles`，而不是直接访问RSSHub路径

2. **Q: 如何添加新的RSS源？**
   A: 编辑`.env`文件中的`RSS_FEEDS`配置项

3. **Q: 日志在哪里查看？**
   A: 项目根目录下的`logs/`文件夹

4. **Q: 推送频率如何设置？**
   A: 使用`CRON_EXPRESSION`环境变量，默认4小时一次

现在您可以重新配置并开始使用服务了！