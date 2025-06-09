// API 配置
export const API_CONFIG = {
  // 基础URL，开发环境
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com'
    : 'http://localhost:8000',
  
  // API版本
  VERSION: 'v1',
  
  // 超时时间（毫秒）
  TIMEOUT: 30000,
  
  // 端点路径
  ENDPOINTS: {
    // 认证相关
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    
    // 用户相关
    USERS: '/api/v1/users',
    USER_ME: '/api/v1/users/me',
    
    // 微信账号相关
    WECHAT_ACCOUNTS: '/api/v1/wechat-accounts',
    
    // 其他端点可以在这里添加
  }
};

// 获取完整的API URL
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
} 