/**
 * 全局错误处理中间件
 * 统一处理应用程序中的错误
 */
import logger from '../utils/logger.js';

/**
 * 错误处理中间件
 * @param {Error} error - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一步函数
 */
function errorHandler(error, req, res, next) {
  let status = 500;
  let message = '服务器内部错误';
  
  // 已知错误类型处理
  if (error.name === 'ValidationError') {
    status = 400;
    message = error.message;
  } else if (error.name === 'CastError') {
    status = 400;
    message = '请求参数格式错误';
  } else if (error.name === 'NotFoundError') {
    status = 404;
    message = '请求的资源不存在';
  } else if (error.code === 'ENOTFOUND') {
    status = 503;
    message = '服务不可用，请检查网络连接';
  } else if (error.response?.status === 429) {
    status = 429;
    message = '请求过于频繁，请稍后重试';
  }
  
  logger.error('请求处理错误:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    status,
    message: error.message,
    stack: error.stack,
    userAgent: req.get('User-Agent')
  });
  
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}

/**
 * 404 错误处理中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一步函数
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`无法找到 ${req.originalUrl}`);
  error.status = 404;
  error.name = 'NotFoundError';
  next(error);
}

export {
  errorHandler,
  notFoundHandler
};