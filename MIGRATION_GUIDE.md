> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。
>
> 注:原文超过 10000 字符,本译文覆盖核心章节(全部章节文字已译,代码块保持原样)。

# Axios 迁移指南

> **从 Axios 0.x 迁移到 1.x**
>
> 本指南通过记录破坏性变更、提供迁移策略以及常见升级难题的解决方案,帮助开发者从 Axios 0.x 升级到 1.x。

## 目录

- [概述](#概述)
- [破坏性变更](#破坏性变更)
- [错误处理迁移](#错误处理迁移)
- [API 变更](#api-变更)
- [配置变更](#配置变更)
- [迁移策略](#迁移策略)
- [常见模式](#常见模式)
- [故障排查](#故障排查)
- [资源](#资源)

## 概述

Axios 1.x 引入了若干破坏性变更,以提升一致性、安全性和开发者体验。虽然这些变更带来了更好的错误处理和更可预测的行为,但从 0.x 版本迁移时需要更新代码。

### 关键变更摘要

| 领域 | 0.x 行为 | 1.x 行为 | 影响 |
|------|--------------|--------------|--------|
| 错误处理 | 选择性抛出 | 一致地抛出 | 高 |
| JSON 解析 | 宽松 | 严格 | 中 |
| 浏览器支持 | IE11+ | 现代浏览器 | 低-中 |
| TypeScript | 部分支持 | 完整支持 | 低 |

### 迁移复杂度

- **简单应用**:1-2 小时
- **中等应用**:1-2 天
- **带复杂错误处理的大型应用**:3-5 天

## 破坏性变更

### 1. 错误处理变更

**Axios 1.x 中最重要的变化是错误的处理方式。**

#### 0.x 行为
```javascript
// Axios 0.x - Some HTTP error codes didn't throw
axios.get('/api/data')
  .then(response => {
    // Response interceptor could handle all errors
    console.log('Success:', response.data);
  });

// Response interceptor handled everything
axios.interceptors.response.use(
  response => response,
  error => {
    handleError(error);
    // Error was "handled" and didn't propagate
  }
);
```

#### 1.x 行为
```javascript
// Axios 1.x - All HTTP errors throw consistently
axios.get('/api/data')
  .then(response => {
    console.log('Success:', response.data);
  })
  .catch(error => {
    // Must handle errors at call site or they propagate
    console.error('Request failed:', error);
  });

// Response interceptor must re-throw or return rejected promise
axios.interceptors.response.use(
  response => response,
  error => {
    handleError(error);
    // Must explicitly handle propagation
    return Promise.reject(error); // or throw error;
  }
);
```

#### 影响
- **响应拦截器**不再能"悄悄吞掉"错误
- **每一个 API 调用**都必须显式处理错误,否则会变成未处理的 Promise rejection
- **集中式错误处理**需要采用新的模式

### 2. JSON 解析变更

#### 0.x 行为
```javascript
// Axios 0.x - Lenient JSON parsing
// Would attempt to parse even invalid JSON
response.data; // Might contain partial data or fallbacks
```

#### 1.x 行为
```javascript
// Axios 1.x - Strict JSON parsing
// Throws clear errors for invalid JSON
try {
  const data = response.data;
} catch (error) {
  // Handle JSON parsing errors explicitly
}
```

### 3. 请求/响应转换器变更

#### 0.x 行为
```javascript
// Implicit transformations with some edge cases
transformRequest: [function (data) {
  // Less predictable behavior
  return data;
}]
```

#### 1.x 行为
```javascript
// More consistent transformation pipeline
transformRequest: [function (data, headers) {
  // Headers parameter always available
  // More predictable behavior
  return data;
}]
```

### 4. 浏览器支持变更

- **0.x**:支持 IE11 及更老的浏览器
- **1.x**:要求支持 Promise 的现代浏览器
- **Polyfill**:如需支持老浏览器可能需要引入

## 错误处理迁移

错误处理的变更迁移到 Axios 1.x 时最复杂的部分。以下是经过验证的策略:

### 策略 1:使用错误边界做集中式错误处理

```javascript
// Create a centralized error handler
class ApiErrorHandler {
  constructor() {
    this.setupInterceptors();
  }

  setupInterceptors() {
    axios.interceptors.response.use(
      response => response,
      error => {
        // Centralized error processing
        this.processError(error);
        
        // Return a resolved promise with error info for handled errors
        if (this.isHandledError(error)) {
          return Promise.resolve({
            data: null,
            error: this.normalizeError(error),
            handled: true
          });
        }
        
        // Re-throw unhandled errors
        return Promise.reject(error);
      }
    );
  }

  processError(error) {
    // Log errors
    console.error('API Error:', error);
    
    // Show user notifications
    if (error.response?.status === 401) {
      this.handleAuthError();
    } else if (error.response?.status >= 500) {
      this.showErrorNotification('Server error occurred');
    }
  }

  isHandledError(error) {
    // Define which errors are "handled" centrally
    const handledStatuses = [401, 403, 404, 422, 500, 502, 503];
    return handledStatuses.includes(error.response?.status);
  }

  normalizeError(error) {
    return {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      code: error.response?.data?.code || error.code
    };
  }

  handleAuthError() {
    // Redirect to login, clear tokens, etc.
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  showErrorNotification(message) {
    // Show user-friendly error message
    console.error(message); // Replace with your notification system
  }
}

// Initialize globally
const errorHandler = new ApiErrorHandler();

// Usage in components/services
async function fetchUserData(userId) {
  try {
    const response = await axios.get(`/api/users/${userId}`);
    
    // Check if error was handled centrally
    if (response.handled) {
      return { data: null, error: response.error };
    }
    
    return { data: response.data, error: null };
  } catch (error) {
    // Unhandled errors still need local handling
    return { data: null, error: { message: 'Unexpected error occurred' } };
  }
}
```

### 策略 2:包装函数模式

```javascript
// Create a wrapper that provides 0.x-like behavior
function createApiWrapper() {
  const api = axios.create();
  
  // Add response interceptor for centralized handling
  api.interceptors.response.use(
    response => response,
    error => {
      // Handle common errors centrally
      if (error.response?.status === 401) {
        // Handle auth errors
        handleAuthError();
      }
      
      if (error.response?.status >= 500) {
        // Handle server errors
        showServerErrorNotification();
      }
      
      // Always reject to maintain error propagation
      return Promise.reject(error);
    }
  );

  // Wrapper function that mimics 0.x behavior
  function safeRequest(requestConfig, options = {}) {
    return api(requestConfig)
      .then(response => response)
      .catch(error => {
        if (options.suppressErrors) {
          // Return error info instead of throwing
          return {
            data: null,
            error: {
              status: error.response?.status,
              message: error.response?.data?.message || error.message
            }
          };
        }
        throw error;
      });
  }

  return { safeRequest, axios: api };
}

// Usage
const { safeRequest } = createApiWrapper();

// For calls where you want centralized error handling
const result = await safeRequest(
  { method: 'get', url: '/api/data' },
  { suppressErrors: true }
);

if (result.error) {
  // Handle error case
  console.log('Request failed:', result.error.message);
} else {
  // Handle success case
  console.log('Data:', result.data);
}
```

### 策略 3:基于自定义事件的全局错误处理器

```javascript
// Set up global error handling with events
class GlobalErrorHandler extends EventTarget {
  constructor() {
    super();
    this.setupInterceptors();
  }

  setupInterceptors() {
    axios.interceptors.response.use(
      response => response,
      error => {
        // Emit custom event for global handling
        this.dispatchEvent(new CustomEvent('apiError', {
          detail: { error, timestamp: new Date() }
        }));

        // Always reject to maintain proper error flow
        return Promise.reject(error);
      }
    );
  }
}

const globalErrorHandler = new GlobalErrorHandler();

// Set up global listeners
globalErrorHandler.addEventListener('apiError', (event) => {
  const { error } = event.detail;
  
  // Centralized error logic
  if (error.response?.status === 401) {
    handleAuthError();
  }
  
  if (error.response?.status >= 500) {
    showErrorNotification('Server error occurred');
  }
});

// Usage remains clean
async function apiCall() {
  try {
    const response = await axios.get('/api/data');
    return response.data;
  } catch (error) {
    // Error was already handled globally
    // Just handle component-specific logic
    return null;
  }
}
```

## API 变更

### 请求配置

#### 0.x 到 1.x 的变更
```javascript
// 0.x - Some properties had different defaults
const config = {
  timeout: 0, // No timeout by default
  maxContentLength: -1, // No limit
};

// 1.x - More secure defaults
const config = {
  timeout: 0, // Still no timeout, but easier to configure
  maxContentLength: 2000, // Default limit for security
  maxBodyLength: 2000, // New property
};
```

### 响应对象

响应对象的结构大体不变,但错误响应更加一致:

```javascript
// Both 0.x and 1.x
response = {
  data: {}, // Response body
  status: 200, // HTTP status
  statusText: 'OK', // HTTP status message  
  headers: {}, // Response headers
  config: {}, // Request config
  request: {} // Request object
};

// Error responses are more consistent in 1.x
error.response = {
  data: {}, // Error response body
  status: 404, // HTTP error status
  statusText: 'Not Found',
  headers: {},
  config: {},
  request: {}
};
```

## 配置变更

### 默认配置更新

```javascript
// 0.x defaults
axios.defaults.timeout = 0; // No timeout
axios.defaults.maxContentLength = -1; // No limit

// 1.x defaults (more secure)
axios.defaults.timeout = 0; // Still no timeout
axios.defaults.maxContentLength = 2000; // 2MB limit
axios.defaults.maxBodyLength = 2000; // 2MB limit
```

### 实例配置

```javascript
// 0.x - Instance creation
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 1000,
});

// 1.x - Same API, but more options available
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 1000,
  maxBodyLength: Infinity, // Override default if needed
  maxContentLength: Infinity,
});
```

## 迁移策略

### 分步迁移流程

#### 阶段 1:准备
1. **审计现有错误处理**
   ```bash
   # Find all axios usage
   grep -r "axios\." src/
   grep -r "\.catch" src/
   grep -r "interceptors" src/
   ```

2. **识别模式**
   - 处理错误的响应拦截器
   - 依赖集中式错误处理的组件
   - 认证与重试逻辑

3. **创建测试用例**
   ```javascript
   // Test current error handling behavior
   describe('Error Handling Migration', () => {
     it('should handle 401 errors consistently', async () => {
       // Test authentication error flows
     });
     
     it('should handle 500 errors with user feedback', async () => {
       // Test server error handling
     });
   });
   ```

#### 阶段 2:实施
1. **更新依赖**
   ```bash
   npm update axios
   ```

2. **落地新的错误处理**
   - 从上面的策略中选择一种
   - 更新响应拦截器
   - 为 API 调用添加错误处理

3. **更新认证逻辑**
   ```javascript
   // 0.x pattern
   axios.interceptors.response.use(null, error => {
     if (error.response?.status === 401) {
       logout();
       // Error was "handled"
     }
   });

   // 1.x pattern
   axios.interceptors.response.use(
     response => response,
     error => {
       if (error.response?.status === 401) {
         logout();
       }
       return Promise.reject(error); // Always propagate
     }
   );
   ```

#### 阶段 3:测试与验证
1. **测试错误场景**
   - 网络故障
   - HTTP 错误码(401、403、404、500 等)
   - 超时错误
   - JSON 解析错误

2. **验证用户体验**
   - 错误提示正常展示
   - 认证重定向正常工作
   - 加载状态处理正确

### 渐进式迁移方案

对于大型应用,可以考虑渐进式迁移:

```javascript
// Create a compatibility layer
const axiosCompat = {
  // Use new axios instance for new code
  v1: axios.create({
    // 1.x configuration
  }),
  
  // Wrapper for legacy code
  legacy: createLegacyWrapper(axios.create({
    // Configuration that mimics 0.x behavior
  }))
};

function createLegacyWrapper(axiosInstance) {
  // Add interceptors that provide 0.x-like behavior
  axiosInstance.interceptors.response.use(
    response => response,
    error => {
      // Handle errors in 0.x style for legacy code
      handleLegacyError(error);
      // Don't propagate certain errors
      if (shouldSuppressError(error)) {
        return Promise.resolve({ data: null, error: true });
      }
      return Promise.reject(error);
    }
  );
  
  return axiosInstance;
}
```

## 常见模式

### 认证拦截器

#### 更新后的认证模式
```javascript
// Token refresh interceptor for 1.x
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise(resolve => {
          subscribeTokenRefresh(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axios(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const newToken = await refreshToken();
        onTokenRefreshed(newToken);
        isRefreshing = false;
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 重试逻辑

```javascript
// Retry interceptor for 1.x
function createRetryInterceptor(maxRetries = 3, retryDelay = 1000) {
  return axios.interceptors.response.use(
    response => response,
    async error => {
      const config = error.config;
      
      if (!config || !config.retry) {
        return Promise.reject(error);
      }
      
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount >= maxRetries) {
        return Promise.reject(error);
      }
      
      config.__retryCount += 1;
      
      // Exponential backoff
      const delay = retryDelay * Math.pow(2, config.__retryCount - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return axios(config);
    }
  );
}

// Usage
const api = axios.create();
createRetryInterceptor(3, 1000);

// Make request with retry
api.get('/api/data', { retry: true });
```

### 加载状态管理

```javascript
// Loading interceptor for 1.x
class LoadingManager {
  constructor() {
    this.requests = new Set();
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    axios.interceptors.request.use(config => {
      this.requests.add(config);
      this.updateLoadingState();
      return config;
    });
    
    axios.interceptors.response.use(
      response => {
        this.requests.delete(response.config);
        this.updateLoadingState();
        return response;
      },
      error => {
        this.requests.delete(error.config);
        this.updateLoadingState();
        return Promise.reject(error);
      }
    );
  }
  
  updateLoadingState() {
    const isLoading = this.requests.size > 0;
    // Update your loading UI
    document.body.classList.toggle('loading', isLoading);
  }
}

const loadingManager = new LoadingManager();
```

## 故障排查

### 常见迁移问题

#### 问题 1:未处理的 Promise Rejection

**问题:**
```javascript
// This pattern worked in 0.x but causes unhandled rejections in 1.x
axios.get('/api/data'); // No .catch() handler
```

**解决方案:**
```javascript
// Always handle promises
axios.get('/api/data')
  .catch(error => {
    // Handle error appropriately
    console.error('Request failed:', error.message);
  });

// Or use async/await with try/catch
async function fetchData() {
  try {
    const response = await axios.get('/api/data');
    return response.data;
  } catch (error) {
    console.error('Request failed:', error.message);
    return null;
  }
}
```

#### 问题 2:响应拦截器无法再"接管"错误

**问题:**
```javascript
// 0.x style - interceptor "handled" errors
axios.interceptors.response.use(null, error => {
  showErrorMessage(error.message);
  // Error was considered "handled"
});
```

**解决方案:**
```javascript
// 1.x style - explicitly control error propagation
axios.interceptors.response.use(
  response => response,
  error => {
    showErrorMessage(error.message);
    
    // Choose whether to propagate the error
    if (shouldPropagateError(error)) {
      return Promise.reject(error);
    }
    
    // Return success-like response for "handled" errors
    return Promise.resolve({
      data: null,
      handled: true,
      error: normalizeError(error)
    });
  }
);
```

#### 问题 3:JSON 解析错误

**问题:**
```javascript
// 1.x is stricter about JSON parsing
// This might throw where 0.x was lenient
const data = response.data;
```

**解决方案:**
```javascript
// Add response transformer for better error handling
axios.defaults.transformResponse = [
  function (data) {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (e) {
        // Handle JSON parsing errors gracefully
        console.warn('Invalid JSON response:', data);
        return { error: 'Invalid JSON', rawData: data };
      }
    }
    return data;
  }
];
```

#### 问题 4:升级后的 TypeScript 错误

**问题:**
```typescript
// TypeScript errors after upgrade
const response = await axios.get('/api/data');
// Property 'someProperty' does not exist on type 'any'
```

**解决方案:**
```typescript
// Define proper interfaces
interface ApiResponse {
  data: any;
  message: string;
  success: boolean;
}

const response = await axios.get<ApiResponse>('/api/data');
// Now properly typed
console.log(response.data.data);
```

### 调试迁移问题

#### 启用调试日志
```javascript
// Add request/response logging
axios.interceptors.request.use(config => {
  console.log('Request:', config);
  return config;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.log('Error:', error);
    return Promise.reject(error);
  }
);
```

#### 对比行为
```javascript
// Create side-by-side comparison during migration
const axios0x = require('axios-0x'); // Keep old version for testing
const axios1x = require('axios');

async function compareRequests(config) {
  try {
    const [result0x, result1x] = await Promise.allSettled([
      axios0x(config),
      axios1x(config)
    ]);
    
    console.log('0.x result:', result0x);
    console.log('1.x result:', result1x);
  } catch (error) {
    console.log('Comparison error:', error);
  }
}
```

## 资源

### 官方文档
- [Axios 1.x 文档](https://axios-http.com/)
- [Axios GitHub 仓库](https://github.com/axios/axios)
- [Axios 更新日志](https://github.com/axios/axios/blob/main/CHANGELOG.md)

### 迁移工具
- [Axios Migration Codemod](https://github.com/axios/axios-migration-codemod) *(如可用)*
- [Axios 1.x 的 ESLint 规则](https://github.com/axios/eslint-plugin-axios) *(如可用)*

### 社区资源
- [Stack Overflow - Axios 迁移问题](https://stackoverflow.com/questions/tagged/axios+migration)
- [GitHub Discussions](https://github.com/axios/axios/discussions)
- [Axios Discord 社区](https://discord.gg/axios) *(如可用)*

### 相关 Issue
- [错误处理变更讨论](https://github.com/axios/axios/issues/7208)
- [迁移指南请求](https://github.com/axios/axios/issues/xxxx) *(相关 issue 链接)*

---

## 需要帮助?

如果迁移中遇到本指南未覆盖的问题:

1. 在 [Axios GitHub 仓库](https://github.com/axios/axios/issues)中**搜索已有 issue**
2. 在 [GitHub Discussions](https://github.com/axios/axios/discussions) 中**提问**
3. 为本迁移指南**贡献改进**

---

*本迁移指南由社区维护。如发现错误或有建议,请[提交 issue](https://github.com/axios/axios/issues)或发起 pull request。*
