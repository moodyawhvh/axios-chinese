> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 身份验证(Authentication)

大多数 API 都需要某种形式的身份验证。本页介绍为 axios 请求附加凭据的最常见模式。

## Bearer 令牌(JWT)

最常见的做法是把 JWT 放进 `Authorization` 请求头。最干净的方式是在 axios 实例上挂一个请求拦截器,这样每次请求都会重新读取最新的令牌:

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
```

## HTTP Basic 认证

对于使用 HTTP Basic 认证的 API,传入 `auth` 选项即可。axios 会自动编码凭据并设置 `Authorization` 请求头:

```js
const response = await axios.get("https://api.example.com/data", {
  auth: {
    username: "myUser",
    password: "myPassword",
  },
});
```

如果不提供 `auth`,Node.js HTTP 适配器和 fetch 适配器也可以从请求 URL 中提取 Basic 认证凭据,例如 `https://myUser:myPassword@api.example.com/data`。URL 中经百分号编码的凭据会在生成 `Authorization` 请求头之前被解码。新代码建议使用显式的 `auth` 选项;它的优先级高于 URL 内嵌凭据。

::: tip
Bearer 令牌和 API key 请使用自定义 `Authorization` 请求头,而不是 `auth` 选项——`auth` 仅用于 HTTP Basic。
:::

## API key

API key 通常通过请求头或查询参数传递,取决于 API 的要求:

```js
// As a header
const api = axios.create({
  baseURL: "https://api.example.com",
  headers: { "X-API-Key": "your-api-key-here" },
});

// As a query parameter
const response = await axios.get("https://api.example.com/data", {
  params: { apiKey: "your-api-key-here" },
});
```

## 令牌刷新

访问令牌过期时,需要静默刷新并重试失败的请求。响应拦截器是实现这一逻辑的合适位置:

```js
import axios from "axios";

const api = axios.create({ baseURL: "https://api.example.com" });

// Track whether a refresh is already in progress to avoid parallel refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post("/auth/refresh", {
          refreshToken: localStorage.getItem("refresh_token"),
        });

        const newToken = data.access_token;
        localStorage.setItem("access_token", newToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Redirect to login or emit an event
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

## 基于 Cookie 的身份验证

对于依赖 Cookie 的会话型 API,设置 `withCredentials: true` 让跨源请求携带 Cookie:

```js
const api = axios.create({
  baseURL: "https://api.example.com",
  withCredentials: true, // send cookies with every request
});
```

::: warning
`withCredentials: true` 要求服务器响应 `Access-Control-Allow-Credentials: true` 以及一个具体的(非通配符)`Access-Control-Allow-Origin`。
:::
