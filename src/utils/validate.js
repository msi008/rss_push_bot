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

module.exports = {
  isValidUrl,
  isValidEmail,
  isNotEmpty,
  isValidRssItem,
  isValidWxRobotKey
};