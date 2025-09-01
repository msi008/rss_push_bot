/**
 * Vercel 定时任务调度器
 * 适配 Vercel 的 Cron Jobs 解决方案
 */
const scheduler = require('./services/scheduler');

/**
 * 导出定时任务执行函数
 * 用于 Vercel Cron Jobs 调用
 */
module.exports = async (req, res) => {
  try {
    console.log('开始执行 Vercel 定时 RSS 推送任务...');
    await scheduler.performScheduledPush();
    res.status(200).json({ message: '调度任务执行成功' });
  } catch (error) {
    console.error('Vercel 定时任务执行失败:', error);
    res.status(500).json({ error: '任务执行失败', details: error.message });
  }
};