/**
 * 日志工具模块
 * 使用Winston创建结构化日志系统
 */
const winston = require('winston');
const path = require('path');
const config = require('../config/config');

/**
 * 创建日志格式
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * 创建Winston日志实例
 */
const logger = winston.createLogger({
  level: config.logLevel,
  format: fileFormat,
  defaultMeta: { service: 'rss-push-bot' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs', 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

/**
 * 开发环境添加控制台日志
 */
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * 创建流式日志（供morgan使用）
 */
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;