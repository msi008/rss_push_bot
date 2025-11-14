/**
 * 验证工具模块
 * 提供各种数据验证函数
 */

/**
 * 验证URL格式
 * @param {string} url - 需要验证的URL
 * @returns {boolean} URL是否有效
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 验证邮箱地址格式
 * @param {string} email - 需要验证的邮箱地址
 * @returns {boolean} 邮箱是否有效
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证字符串不能为空
 * @param {string} str - 需要验证的字符串
 * @returns {boolean} 字符串是否非空
 */
function isNotEmpty(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * 验证RSS文章数据
 * @param {Object} item - RSS文章对象
 * @returns {boolean} 文章数据是否有效
 */
function isValidRssItem(item) {
  return item &&
         isNotEmpty(item.title) &&
         (isValidUrl(item.link) || isNotEmpty(item.guid));
}

/**
 * 验证企业微信机器人key
 * @param {string} key - 机器人key
 * @returns {boolean} key是否有效
 */
function isValidWxRobotKey(key) {
  return isNotEmpty(key) && key.length === 36;
}

/**
 * 将rsshub://协议转换为实际URL
 * @param {string} rsshubUrl - rsshub协议URL
 * @returns {string} 转换后的实际URL
 */
function convertRsshubToUrl(rsshubUrl) {
  if (!rsshubUrl) {
    return null;
  }
  
  // 如果已经是http/https URL，直接返回
  if (rsshubUrl.startsWith('http://') || rsshubUrl.startsWith('https://')) {
    return rsshubUrl;
  }
  
  // 处理rsshub://协议
  if (rsshubUrl.startsWith('rsshub://')) {
    // 提取路径部分（例如：twitter/user/myfxtrader）
    const path = rsshubUrl.replace('rsshub://', '');
    
    // 尝试多个RSSHub服务
    const services = [
      'https://rsshub.t8.host',
      'https://rsshub.org.cn',
      'https://rsshub.app'
    ];
    
    // 随机选择一个服务，提高可用性
    const service = services[Math.floor(Math.random() * services.length)];
    
    return `${service}/${path}`;
  }
  
  // 其他情况直接返回原URL
  return rsshubUrl;
}

export {
  isValidUrl,
  isValidEmail,
  isNotEmpty,
  isValidRssItem,
  isValidWxRobotKey,
  convertRsshubToUrl
};