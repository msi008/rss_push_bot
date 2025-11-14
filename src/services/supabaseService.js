/**
 * Supabase数据库服务
 * 提供文章数据的持久化存储功能
 */
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';
import config from '../config/config.js';

// Supabase客户端实例
let supabase = null;

/**
 * 初始化Supabase客户端
 */
function initializeSupabase() {
  try {
    if (!config.supabase.url || !config.supabase.anonKey) {
      logger.warn('Supabase配置不完整，将使用内存存储');
      return null;
    }

    supabase = createClient(config.supabase.url, config.supabase.anonKey);
    logger.info('Supabase客户端初始化成功');
    return supabase;
  } catch (error) {
    logger.error(`Supabase初始化失败: ${error.message}`);
    return null;
  }
}

/**
 * 确保Supabase已初始化
 */
function ensureSupabase() {
  if (!supabase) {
    supabase = initializeSupabase();
  }
  return supabase;
}

/**
 * 保存文章到数据库
 * @param {Array} articles - 文章数组
 * @returns {Promise<Object>} - 保存结果
 */
async function saveArticles(articles) {
  const client = ensureSupabase();
  if (!client) {
    logger.warn('Supabase不可用，跳过保存文章');
    return { success: false, message: 'Supabase不可用' };
  }

  try {
    // 准备文章数据
    const articlesToInsert = articles.map(article => ({
      title: article.title,
      link: article.link,
      author: article.author,
      summary: article.summary,
      content: article.content,
      pub_date: article.pubDate,
      source: article.source,
      created_at: new Date().toISOString()
    }));

    // 使用upsert操作，避免重复插入
    const { data, error } = await client
      .from('articles')
      .upsert(articlesToInsert, { 
        onConflict: 'link',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      logger.error(`保存文章到Supabase失败: ${error.message}`);
      return { success: false, error: error.message };
    }

    logger.info(`成功保存${articlesToInsert.length}篇文章到Supabase`);
    return { success: true, data, count: articlesToInsert.length };
  } catch (error) {
    logger.error(`保存文章异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 从数据库获取文章
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} - 文章数组
 */
async function getArticles(options = {}) {
  const client = ensureSupabase();
  if (!client) {
    logger.warn('Supabase不可用，返回空数组');
    return [];
  }

  try {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'pub_date',
      order = 'desc',
      source,
      startDate,
      endDate
    } = options;

    let query = client
      .from('articles')
      .select('*')
      .range(offset, offset + limit - 1)
      .order(orderBy, { ascending: order === 'asc' });

    // 添加过滤条件
    if (source) {
      query = query.eq('source', source);
    }

    if (startDate) {
      query = query.gte('pub_date', startDate);
    }

    if (endDate) {
      query = query.lte('pub_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(`从Supabase获取文章失败: ${error.message}`);
      return [];
    }

    // 转换数据格式以匹配现有接口
    return data.map(article => ({
      title: article.title,
      link: article.link,
      author: article.author,
      summary: article.summary,
      content: article.content,
      pubDate: article.pub_date,
      source: article.source
    }));
  } catch (error) {
    logger.error(`获取文章异常: ${error.message}`);
    return [];
  }
}

/**
 * 根据链接获取文章
 * @param {string} link - 文章链接
 * @returns {Promise<Object|null>} - 文章对象或null
 */
async function getArticleByLink(link) {
  const client = ensureSupabase();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from('articles')
      .select('*')
      .eq('link', link)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 未找到记录
        return null;
      }
      logger.error(`根据链接获取文章失败: ${error.message}`);
      return null;
    }

    return {
      title: data.title,
      link: data.link,
      author: data.author,
      summary: data.summary,
      content: data.content,
      pubDate: data.pub_date,
      source: data.source
    };
  } catch (error) {
    logger.error(`获取文章异常: ${error.message}`);
    return null;
  }
}

/**
 * 根据链接批量获取文章
 * @param {Array} links - 文章链接数组
 * @returns {Promise<Array>} - 文章数组
 */
async function getArticlesByLinks(links) {
  const client = ensureSupabase();
  if (!client) {
    logger.warn('Supabase不可用，返回空数组');
    return [];
  }

  try {
    const { data, error } = await client
      .from('articles')
      .select('*')
      .in('link', links);

    if (error) {
      logger.error(`批量获取文章失败: ${error.message}`);
      return [];
    }

    // 转换数据格式以匹配现有接口
    return data.map(article => ({
      title: article.title,
      link: article.link,
      author: article.author,
      summary: article.summary,
      content: article.content,
      pubDate: article.pub_date,
      source: article.source
    }));
  } catch (error) {
    logger.error(`批量获取文章异常: ${error.message}`);
    return [];
  }
}

/**
 * 删除指定日期之前的文章
 * @param {string} cutoffDate - 截止日期
 * @returns {Promise<Object>} - 删除结果
 */
async function deleteOldArticles(cutoffDate) {
  const client = ensureSupabase();
  if (!client) {
    return { success: false, message: 'Supabase不可用' };
  }

  try {
    const { error } = await client
      .from('articles')
      .lt('pub_date', cutoffDate)
      .delete();

    if (error) {
      logger.error(`删除旧文章失败: ${error.message}`);
      return { success: false, error: error.message };
    }

    logger.info(`成功删除${cutoffDate}之前的文章`);
    return { success: true };
  } catch (error) {
    logger.error(`删除旧文章异常: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * 获取文章统计信息
 * @returns {Promise<Object>} - 统计信息
 */
async function getArticleStats() {
  const client = ensureSupabase();
  if (!client) {
    return { total: 0, bySource: {} };
  }

  try {
    const { data, error } = await client
      .from('articles')
      .select('source')
      .then(({ data, error }) => {
        if (error) throw error;
        
        // 统计各源的文章数量
        const stats = { total: data.length, bySource: {} };
        data.forEach(article => {
          const source = article.source || '未知来源';
          stats.bySource[source] = (stats.bySource[source] || 0) + 1;
        });
        
        return stats;
      });

    if (error) {
      logger.error(`获取文章统计失败: ${error.message}`);
      return { total: 0, bySource: {} };
    }

    return data;
  } catch (error) {
    logger.error(`获取文章统计异常: ${error.message}`);
    return { total: 0, bySource: {} };
  }
}

export {
  initializeSupabase,
  saveArticles,
  getArticles,
  getArticleByLink,
  getArticlesByLinks,
  deleteOldArticles,
  getArticleStats
};