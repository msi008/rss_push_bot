# Supabase集成说明

本项目已集成Supabase作为云数据库，用于持久化存储RSS文章数据。

## 设置步骤

### 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com) 并注册账号
2. 创建新项目，选择数据库位置
3. 等待项目创建完成

### 2. 获取项目配置

在Supabase项目仪表板中：

1. 进入 **Settings > API**
2. 复制 **Project URL** 和 **anon public** 匿名密钥

### 3. 创建数据表

1. 进入 **SQL Editor**
2. 粘贴 `database/supabase-schema.sql` 文件中的SQL代码
3. 点击 **Run** 执行SQL语句

或者，你也可以通过以下方式创建表：

1. 进入 **Table Editor**
2. 点击 **Create a new table**
3. 表名：`articles`
4. 添加以下列：
   - `id` (UUID, Primary Key, Default: gen_random_uuid())
   - `title` (Text, Not Null)
   - `link` (Text, Not Null, Unique)
   - `author` (Text, Nullable)
   - `summary` (Text, Nullable)
   - `content` (Text, Nullable)
   - `pub_date` (Timestamp with Time Zone, Nullable)
   - `source` (Text, Nullable)
   - `created_at` (Timestamp with Time Zone, Default: NOW())
   - `updated_at` (Timestamp with Time Zone, Default: NOW())

### 4. 配置环境变量

在项目根目录的 `.env` 文件中添加以下配置：

```env
# Supabase配置
SUPABASE_ENABLED=true
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

或者复制 `.env.example` 到 `.env` 并填入实际值：

```bash
cp .env.example .env
```

### 5. 重启应用

```bash
npm run dev
```

## 功能特性

### 数据持久化

- 所有获取到的RSS文章将自动保存到Supabase数据库
- 避免重复数据，基于文章链接进行去重
- 支持历史数据查询

### 性能优化

- 使用索引提高查询速度
- 支持分页获取大量数据
- 按来源和日期范围筛选

### 数据管理

- 自动删除过期文章（可配置）
- 提供文章统计信息
- 支持手动清理数据

## API使用

### 保存文章

```javascript
import { saveArticles } from './src/services/supabaseService.js';

const articles = [
  {
    title: "示例文章",
    link: "https://example.com/article",
    author: "作者",
    summary: "摘要",
    content: "内容",
    pubDate: "2023-01-01T00:00:00Z",
    source: "来源"
  }
];

const result = await saveArticles(articles);
console.log(result);
```

### 获取文章

```javascript
import { getArticles } from './src/services/supabaseService.js';

// 获取最近50篇文章
const articles = await getArticles({ limit: 50 });

// 按来源筛选
const techArticles = await getArticles({ 
  source: "科技新闻", 
  limit: 20 
});

// 按日期范围筛选
const recentArticles = await getArticles({
  startDate: "2023-01-01",
  endDate: "2023-01-31",
  limit: 100
});
```

### 获取统计信息

```javascript
import { getArticleStats } from './src/services/supabaseService.js';

const stats = await getArticleStats();
console.log(`总文章数: ${stats.total}`);
console.log("各来源文章数:", stats.bySource);
```

## 注意事项

1. **数据安全**：本示例使用RLS策略允许所有操作，生产环境应根据需要调整权限
2. **容量限制**：Supabase免费版有存储和带宽限制，请根据使用情况选择合适套餐
3. **性能考虑**：大量数据时建议定期清理旧文章，保持数据库性能

## 故障排除

### 连接问题

- 检查Supabase URL和密钥是否正确
- 确认网络连接正常
- 查看应用日志中的错误信息

### 表不存在错误

- 确认已执行SQL创建表
- 检查表名是否正确（应为小写`articles`）
- 确认有足够的权限创建表

### RLS权限问题

- 检查RLS策略是否正确设置
- 确认API密钥有足够权限
- 在Supabase仪表板中验证权限设置