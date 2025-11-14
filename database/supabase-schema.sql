-- 创建文章表
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  link TEXT NOT NULL UNIQUE,
  author TEXT,
  summary TEXT,
  content TEXT,
  pub_date TIMESTAMP WITH TIME ZONE,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_articles_link ON articles(link);
CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles(pub_date);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器，在更新记录时自动更新updated_at字段
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建RLS策略（行级安全）
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 允许所有读取操作
CREATE POLICY "Enable read access for all users" ON articles
  FOR SELECT USING (true);

-- 允许所有插入操作
CREATE POLICY "Enable insert access for all users" ON articles
  FOR INSERT WITH CHECK (true);

-- 允许所有更新操作
CREATE POLICY "Enable update access for all users" ON articles
  FOR UPDATE USING (true);

-- 允许所有删除操作
CREATE POLICY "Enable delete access for all users" ON articles
  FOR DELETE USING (true);