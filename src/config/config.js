/**
 * 应用配置文件
 * 管理环境变量和应用配置
 */
const path = require('path');
require('dotenv').config();

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

module.exports = new Config();