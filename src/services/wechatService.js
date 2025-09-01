/**
 * 企业微信推送服务模块
 * 负责将RSS内容推送到企业微信群机器人
 */
const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/config');
const { isValidWxRobotKey, isNotEmpty } = require('../utils/validate');

/**
 * 企业微信API基础配置
 */
const WX_API_URL = config.wxRobot.url;

/**
 * 发送文本消息到企业微信
 * @param {string} content - 消息内容
 * @param {Array} mentionedList - @的成员列表，默认@所有人
 * @returns {Promise<Object>} API响应
 */
async function sendTextMessage(content, mentionedList = ['@all']) {
  if (!isNotEmpty(content)) {
    throw new Error('消息内容不能为空');
  }
  
  const data = {
    msgtype: 'text',
    text: {
      content: content,
      mentioned_list: mentionedList
    }
  };
  
  return sendRequest(data);
}

/**
 * 发送markdown消息到企业微信
 * @param {string} content - markdown格式内容
 * @returns {Promise<Object>} API响应
 */
async function sendMarkdownMessage(content) {
  if (!isNotEmpty(content)) {
    throw new Error('消息内容不能为空');
  }
  
  const data = {
    msgtype: 'markdown',
    markdown: {
      content: content
    }
  };
  
  return sendRequest(data);
}

/**
 * 发送RSS文章为Markdown格式消息
 * @param {Array} articles - RSS文章列表
 * @param {string} customTitle - 自定义标题
 * @returns {Promise<Object>} API响应
 */
async function sendRssArticles(articles, customTitle = '') {
  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error('文章列表不能为空');
  }
  
  const title = customTitle || `${config.wxRobot.title} - ${new Date().toLocaleString('zh-CN')}`;
  
  let markdownContent = `# ${title}\n\n`;
  markdownContent += `> 📅 更新时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  articles.forEach((article, index) => {
    const author = article.author === '未知作者' ? '' : ` - ${article.author}`;
    const pubDate = new Date(article.pubDate).toLocaleString('zh-CN');
    
    markdownContent += `## ${index + 1}. ${article.title}\n`;
    markdownContent += `👤 作者: ${article.author}\n`;
    markdownContent += `📅 发布时间: ${pubDate}\n`;
    
    if (isNotEmpty(article.summary)) {
      const summary = article.summary.length > 200 
        ? article.summary.substring(0, 200) + '...'
        : article.summary;
      markdownContent += `> ${summary}\n`;
    }
    
    markdownContent += `🔗 [查看文章](${article.link})\n`;
    markdownContent += `📰 来源: ${article.source}\n\n`;
    
    if (index < articles.length - 1) {
      markdownContent += '---\n\n';
    }
  });
  
  // 限制内容长度
  if (markdownContent.length > 4096) {
    markdownContent = markdownContent.substring(0, 4000);
    markdownContent += '\n\n...内容过长，已截断';
  }
  
  return sendMarkdownMessage(markdownContent);
}

/**
 * 发送HTTP请求到企业微信API
 * @param {Object} data - 请求数据
 * @returns {Promise<Object>} API响应
 */
async function sendRequest(data) {
  const robotKey = config.wxRobot.key;
  
  if (!isValidWxRobotKey(robotKey)) {
    throw new Error('企业微信机器人key格式不正确');
  }
  
  const webhookUrl = `${WX_API_URL}?key=${robotKey}`;
  
  try {
    logger.debug(`发送消息到企业微信: ${JSON.stringify(data)}`);
    
    const response = await axios.post(webhookUrl, data, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RSS-Push-Bot/1.0.0 Node.js'
      },
      timeout: 10000
    });
    
    // logger.info('消息发送成功');
    // logger.debug('企业微信响应:', response.data);
    
    return response.data;
    
  } catch (error) {
    if (error.response) {
      logger.error(`企业微信API响应错误: ${error.response.data?.errcode}`, {
        status: error.response.status,
        data: error.response.data,
        requestData: data
      });
      throw new Error(`发送消息失败: ${error.response.data?.errmsg || '未知错误'}`);
    } else if (error.code === 'ENOTFOUND') {
      logger.error('网络连接失败，无法访问企业微信API');
      throw new Error('网络连接失败，请检查网络设置');
    } else {
      logger.error('发送消息失败', { error: error.message });
      throw new Error(`发送消息失败: ${error.message}`);
    }
  }
}

/**
 * 检查企业微信机器人是否有效
 * @returns {Promise<boolean>} 是否有效
 */
async function checkRobotStatus() {
  try {
    await sendTextMessage('🤖 RSS推送机器人连接测试');
    logger.info('企业微信机器人验证成功');
    return true;
  } catch (error) {
    logger.error(`企业微信机器人验证失败: ${error.message}`);
    return false;
  }
}

module.exports = {
  sendTextMessage,
  sendMarkdownMessage,
  sendRssArticles,
  checkRobotStatus
};