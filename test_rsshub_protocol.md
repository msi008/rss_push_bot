# RSSHub协议适配使用指南

## 支持的协议格式

现在项目已经完美支持以下三种RSS源格式：

### 1. 标准RSS URL
```
https://example.com/feed.xml
```

### 2. RSSHub路由
```
36kr/hot-list
/36kr/hot-list
```

### 3. RSSHub协议 (推荐)
```
rsshub://36kr/hot-list
rsshub://zhihu/hot-list
rsshub://weibo/timeline/3306934123
```

## 配置示例

在`.env`文件中按如下格式配置RSS源：

```bash
# RSS订阅源配置（支持多种格式）
RSS_FEEDS=[
  {"name":"36氪热门","url":"rsshub://36kr/hot-list","type":"rsshub"},
  {"name":"知乎热榜","url":"rsshub://zhihu/hot","type":"rsshub"},
  {"name":"V2EX","url":"https://www.v2ex.com/index.xml","type":"rss"},
  {"name":"小众软件","url":"rsshub://appinn/today","type":"rsshub"}
]

# RSSHub基础配置
BASE_URL=https://rsshub.app
TIMEZONE=Asia/Shanghai
```

## 验证方法

测试`rsshub://36kr/hot-list`是否正确解析：

```bash
# 启动服务
cd /Users/mac/crawl4AI/rss_push
npm run dev

# 测试API
# 浏览器访问：http://localhost:3000/api/rss/articles
# 或使用curl：  
curl http://localhost:3000/api/rss/articles

# 测试健康检查
curl http://localhost:3000/api/rss/health
```

## URL拼接逻辑演示

对于`rsshub://36kr/hot-list`：
- 原始协议：`rsshub://36kr/hot-list`
- 移除协议前缀：`36kr/hot-list`
- 拼接后的URL：`https://rsshub.app/36kr/hot-list`

对于`rsshub:///36kr/hot-list`（带额外斜杠）：
- 原始协议：`rsshub:///36kr/hot-list`
- 移除协议前缀：`/36kr/hot-list`
- 清理额外斜杠：`36kr/hot-list`
- 拼接后的URL：`https://rsshub.app/36kr/hot-list`

## 兼容性说明

- ✅ 完全向下兼容老的RSSHub路由格式
- ✅ 自动处理多余的斜杠
- ✅ 支持中文源名
- ✅ 支持所有RSSHub支持的源类型

现在可以直接使用`rsshub://36kr/hot-list`这样的格式进行配置了！