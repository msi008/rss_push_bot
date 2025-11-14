/**
 * 应用配置文件
 * 管理环境变量和应用配置
 */
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

class Config {
  constructor() {
    this.port = process.env.PORT || 3000;
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || 'logs/app.log';
    
    // 服务配置
    this.service = {
      corsOrigin: process.env.CORS_ORIGIN || '*',
      host: process.env.SERVICE_HOST || 'localhost',
      baseUrl: process.env.SERVICE_BASE_URL || `http://localhost:${this.port}`
    };
    
    // 企业微信机器人配置
    this.wxRobot = {
      title: "小智",
      key: process.env.WX_ROBOT_KEY,
      url: process.env.WX_ROBOT_URL || 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send'
    };
    
    // RSS配置
    this.rss = {
      checkInterval: parseInt(process.env.CHECK_INTERVAL) || 30, // 分钟
      maxItemsPerFeed: parseInt(process.env.MAX_ITEMS_PER_FEED) || 10
    };

    // 财联社配置
    this.cls = {
      enabled: process.env.CLS_ENABLED === 'true',
      pageSize: parseInt(process.env.CLS_PAGE_SIZE) || 20,
      category: process.env.CLS_CATEGORY || 'red',
      sign: process.env.CLS_SIGN || 'e9fa0dccc6a9574b9b93217871cb0982'
    };

    // Supabase配置
    this.supabase = {
      url: process.env.SUPABASE_URL || 'https://gouafenmgklfldiyydwl.supabase.co',
      anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvdWFmZW5tZ2tsZmxkaXl5ZHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4OTYzNTksImV4cCI6MjA3MDQ3MjM1OX0.L02w2RBTm6sseal_isIsWkczdNopNoMrrJ7QfCK10_w',
      enabled: process.env.SUPABASE_ENABLED
    };

    // API请求配置
    this.api = {
      requestTimeout: parseInt(process.env.API_REQUEST_TIMEOUT) || 10000, // 毫秒
      retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.API_RETRY_DELAY) || 2000, // 毫秒
      cacheBuster: process.env.API_CACHE_BUSTER === 'true',
      forceRefresh: process.env.API_FORCE_REFRESH === 'true'
    };

    // 定时任务配置
    this.scheduler = {
      enabled: process.env.SCHEDULE_ENABLED === 'true',
      cron: process.env.SCHEDULE_CRON || '0 * * * *',
      timezone: process.env.SCHEDULE_TIMEZONE || 'Asia/Shanghai'
    };

    // 解析RSS订阅源
    this.feeds = this.parseFeeds(process.env.RSS_FEEDS);
  }

  /**
   * 解析RSS订阅源配置
   * 支持JSON数组格式和传统字符串格式
   * JSON格式: [{"name":"标题","url":"rss-url","type":"rsshub"}]
   * 传统格式: 标题1,url1|标题2,url2
   */
  parseFeeds(feedsString) {
    if (!feedsString) return [];
    
    try {
      // 尝试解析为JSON数组
      const feeds = JSON.parse(feedsString);
      if (Array.isArray(feeds)) {
        return feeds.map(feed => ({
          name: feed.name || '未命名源',
          url: feed.url || '',
          type: feed.type || 'rss'
        }));
      }
    } catch (e) {
      // 如果解析失败，使用传统格式解析
      return feedsString.split('|').map(feed => {
        const [name, url] = feed.split(',');
        return { name: name || '未命名源', url: url || '', type: 'rss' };
      });
    }
  }

  /**
   * 验证配置是否完整
   */
  validate() {
    const errors = [];
    
    if (!this.wxRobot.key) {
      errors.push('缺少企业微信机器人key (WX_ROBOT_KEY)');
    }
    
    if (this.feeds.length === 0) {
      errors.push('缺少RSS订阅源配置 (RSS_FEEDS)');
    }
    
    return errors;
  }
}

export default new Config();