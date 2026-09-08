# axios 中文文档

[![原项目](https://img.shields.io/badge/原项目-axios--axios-blue?style=flat-square&logo=github)](https://github.com/axios/axios)
[![npm version](https://img.shields.io/npm/v/axios.svg?style=flat-square)](https://www.npmjs.org/package/axios)
[![微信联系](https://img.shields.io/badge/微信-uaycar-brightgreen?style=flat-square&logo=wechat)](#)

> 本文档是 [axios/axios](https://github.com/axios/axios) 官方 README 的中文翻译版本。axios 是一个基于 Promise 的浏览器与 Node.js HTTP 客户端。完整源代码与最新文档请访问 [原项目仓库](https://github.com/axios/axios) 与 [官方网站 axios.rest](https://axios.rest/)。
>
> **代部署 / 定制服务 / 技术咨询 请添加微信:uaycar**

---

## ✨ 特性总览

- 在浏览器中发送 XMLHttpRequest,在 Node.js 中发送 http 请求
- 完全基于 Promise API 处理异步请求,天然兼容 async/await
- 支持请求/响应拦截,可插入自定义逻辑或转换数据
- 自动序列化与解析 JSON 数据
- 数据对象自动序列化为 `multipart/form-data` 或 `application/x-www-form-urlencoded`
- 内置请求取消能力
- 客户端防御 CSRF(XSRF)攻击
- 支持 HTTP/2 与 Fetch adapter
- 内置完整 TypeScript 类型定义

## 📦 安装

使用任意包管理器安装:

```bash
$ npm install axios
$ yarn add axios
$ pnpm add axios
$ bun add axios
$ deno add axios
```

通过 `import` 或 `require` 导入:

```js
import axios, { isCancel, AxiosError } from 'axios';

// CommonJS 环境
const axios = require('axios');
```

CDN 方式引入:

```html
<script src="https://cdn.jsdelivr.net/npm/axios@1.13.2/dist/axios.min.js"></script>
<script src="https://unpkg.com/axios@1.13.2/dist/axios.min.js"></script>
```

## 🚀 使用示例

发送 GET 请求:

```js
import axios from 'axios';

try {
  const response = await axios.get('/user', {
    params: { ID: 12345 },
    timeout: 5000,
  });
  console.log(response);
} catch (error) {
  console.error(error);
}
```

发送 POST 请求:

```js
const response = await axios.post('/user', {
  firstName: 'Fred',
  lastName: 'Flintstone',
});
```

多个并发请求(官方建议用 `Promise.all` 替代已废弃的 `axios.all` / `axios.spread`):

```js
function getUserAccount() {
  return axios.get('/user/12345');
}

function getUserPermissions() {
  return axios.get('/user/12345/permissions');
}

Promise.all([getUserAccount(), getUserPermissions()]).then(function (results) {
  const acct = results[0];
  const perm = results[1];
});
```

> 生产环境建议始终设置 `timeout`,否则卡住的请求可能无限挂起;另外 `async/await` 属于 ES2017,IE 等旧浏览器不支持。

## 🧩 axios API 与方法别名

直接把配置对象传给 `axios` 即可发起请求:

```js
axios({
  method: 'post',
  url: '/user/12345',
  data: { firstName: 'Fred', lastName: 'Flintstone' },
});
```

常用方法别名(使用别名时,`url`、`method`、`data` 无需再写入 config):

- `axios.request(config)`
- `axios.get(url[, config])` / `axios.delete(url[, config])`
- `axios.head(url[, config])` / `axios.options(url[, config])`
- `axios.post(url[, data[, config]])`
- `axios.put(url[, data[, config]])`
- `axios.patch(url[, data[, config]])`

## 🏗️ 创建实例

用 `axios.create([config])` 创建带自定义配置的实例:

```js
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
  headers: { 'X-Custom-Header': 'foobar' },
});
```

## ⚙️ 请求配置(代表性条目)

| 配置项 | 说明 |
|:-------|:-----|
| `url` | 请求 URL,可与 `baseURL` 拼接 |
| `method` | 请求方法,默认 `get` |
| `baseURL` | 会被拼接到 `url` 前的基础地址 |
| `params` | URL 查询参数 |
| `data` | 请求体数据 |
| `timeout` | 超时时间(毫秒),`0` 表示不限制 |
| `headers` | 自定义请求头 |
| `responseType` | 响应数据类型,如 `'json'`、`'blob'`、`'stream'` |
| `onUploadProgress` / `onDownloadProgress` | 上传/下载进度回调 |
| `signal` | 用于取消请求的 AbortController 信号 |

完整配置表请见原 README 的 [Request config 章节](https://github.com/axios/axios#request-config)。

## 📡 响应结构

请求的 `then` 回调会收到包含以下字段的响应对象:

- `data`:服务器返回的响应体
- `status`:HTTP 状态码
- `statusText`:HTTP 状态信息
- `headers`:响应头
- `config`:请求配置
- `request`:底层请求对象(XMLHttpRequest 或 http.ClientRequest)

## 🔧 配置优先级

axios 按「库默认值 → 实例 `defaults` → 单次请求 `config`」的顺序合并配置,优先级依次升高,后者覆盖前者。

## 🪝 拦截器

```js
// 添加请求拦截器
axios.interceptors.request.use(function (config) {
  // 在请求发出前做些处理
  return config;
}, function (error) {
  return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
  // 对响应数据做些处理
  return response;
}, function (error) {
  return Promise.reject(error);
});
```

如需移除某个拦截器,可使用 `axios.interceptors.request.eject(myInterceptor)`。

## ❌ 错误处理

```js
axios.get('/user/12345')
  .catch(function (error) {
    if (error.response) {
      // 服务器返回了非 2xx 状态码
      console.log(error.response.data);
      console.log(error.response.status);
    } else if (error.request) {
      // 请求已发出但未收到响应
      console.log(error.request);
    } else {
      // 设置请求时发生错误
      console.log('Error', error.message);
    }
    console.log(error.config);
  });
```

主要错误类型:`AxiosError`(统一错误基类)、`CanceledError`(请求被取消)。

## 🛑 请求取消

推荐使用 `AbortController`:

```js
const controller = new AbortController();

axios.get('/foo/bar', {
  signal: controller.signal,
}).then(function (response) {
  // ...
});

// 取消请求
controller.abort();
```

旧版 `CancelToken` API 已废弃,请改用 `AbortController`。

## 📨 表单数据与文件上传

`application/x-www-form-urlencoded` 可用 `URLSearchParams`:

```js
const params = new URLSearchParams({ firstName: 'Fred' });
axios.post('/foo', params);
```

axios 也支持自动序列化:当 `content-type` 为 `application/x-www-form-urlencoded` 或 `multipart/form-data` 时,传入的普通对象会被自动转换成对应格式。`FormData`、浏览器 `File`/`Blob`、Node.js `Stream` 可直接作为请求体上传文件,配合 `onUploadProgress` / `onDownloadProgress` 可跟踪上传与下载进度。

## 🌐 其他能力

- 支持 HTTP/2 与 Fetch adapter(可自定义 fetch 实现,详见原 README 对应章节)
- 遵循 Semver 语义化版本
- 原生 TypeScript 类型定义,可为请求参数与响应数据声明类型
- `AxiosHeaders` 类提供 set/get/has/delete/clear 等请求头操作方法

## 📚 资源

- 官方网站:https://axios.rest/
- 文档:https://axios.rest/pages/getting-started/first-steps.html
- 原项目仓库:https://github.com/axios/axios

## 📄 许可证

axios 基于 [MIT](https://github.com/axios/axios/blob/v1.x/LICENSE) 许可证开源。

---

> 本中文文档译自 [axios/axios](https://github.com/axios/axios) 官方 README,所有代码版权归原项目作者所有,遵循其原始许可证。
>
> **代部署 / 定制服务 / 技术咨询 请添加微信:uaycar**
>
> **如果觉得有用,请给原项目点个 Star!** ⭐
