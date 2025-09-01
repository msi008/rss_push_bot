/**
 * Express主应用文件
 * RSSHub企业微信推送服务的主入口
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');

// 加载环境变量
require('dotenv').config();

const config = require('./config/config');
const logger = require('./utils/logger');
const scheduler = require('./services/scheduler');
const rssRoutes = require('./routes/rssRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

/**
 * Express应用实例
 */
const app = express();

/**
 * 配置应用中间件
 */
app.use(helmet());
app.use(cors({
  origin: config.service.corsOrigin,
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

/**
 * 请求日志中间件
 */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

/**
 * 健康检查路由
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * API路由
 */
app.use('/api/rss', rssRoutes);

/**
 * 根路由
 */
app.get('/', (req, res) => {
  res.json({
    name: 'RSSHub企业微信推送服务',
    version: '1.0.0',
    description: '订阅RSSHub源并推送到企业微信机器人',
    endpoints: {
      '/health': '健康检查',
      '/api/rss/articles': '获取RSS文章',
      '/api/rss/push': '手动推送文章',
      '/api/rss/health': 'RSS源健康状态',
      '/api/rss/status': '服务状态信息'
    },
    documentation: '/api/rss/status'
  });
});

/**
 * 错误处理
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * 启动服务器
 */
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 服务器启动成功`);
  logger.info(`📡 监听端口: ${PORT}`);
  logger.info(`🌍 环境模式: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📚 RSS源数量: ${config.feeds.length}`);
  logger.info(`🤖 微信机器人配置: ${config.wxRobot.key ? '已配置' : '未配置'}`);
  
  // 初始化定时任务
  const job = scheduler.initializeScheduler();
  
  logger.info('📊 服务已准备就绪');
});
