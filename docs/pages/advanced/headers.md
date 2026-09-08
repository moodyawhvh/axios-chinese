> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 请求头(Headers)<Badge type="tip" text="New" />

Axios 提供了自己的 AxiosHeaders 类,通过类 Map 的 API 操作请求头,保证键名不区分大小写。Axios 内部使用这个类管理请求头,同时也把它暴露给用户以便使用。虽然 HTTP 请求头本身不区分大小写,但出于风格考虑,以及作为对错误区分请求头大小写的服务器的规避手段,Axios 会保留原始请求头的大小写。直接操作 headers 对象的旧方法仍然可用,但已废弃,不建议在新代码中使用。

## 操作请求头

AxiosHeaders 对象实例可以包含不同类型的内部值,用于控制设置与合并逻辑。最终的 headers 对象由 Axios 调用 toJSON 方法获得。AxiosHeaders 对象也是可迭代的,因此可以在循环中使用它,或将其转换为数组或对象。

请求头的值可以是以下类型之一:

- `string` - 将发送到服务器的普通字符串值
- `null` - 转换为 JSON 时跳过该请求头
- `false` - 转换为 JSON 时跳过该请求头,另外表示必须以 rewrite 选项为 true 调用 set 方法才能覆盖该值(Axios 内部用它允许用户选择不安装某些请求头,如 User-Agent 或 Content-Type)
- `undefined` - 值未设置

::: warning
只要值不是 undefined,该请求头就视为已设置。
:::

headers 对象总是在拦截器和转换器内部被初始化,如下例所示:

```js
axios.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  request.headers.set("My-header", "value");

  request.headers.set({
    "My-set-header1": "my-set-value1",
    "My-set-header2": "my-set-value2",
  });

  // Disable subsequent setting of this header by Axios
  request.headers.set("User-Agent", false);

  request.headers.setContentType("text/plain");

  // Direct access like this is deprecated
  request.headers["My-set-header2"] = "newValue";

  return request;
});
```

你可以用任何可迭代方式遍历 AxiosHeaders,比如 for-of 循环、forEach 或展开运算符:

```js
const headers = new AxiosHeaders({
  foo: '1',
  bar: '2',
  baz: '3',
});

for (const [header, value] of headers) {
  console.log(header, value);
}

// foo 1
// bar 2
// baz 3
```

## 在请求上设置请求头

设置请求头最常用的位置是请求配置或实例配置中的 `headers` 选项:

```js
// On a single request
await axios.get('/api/data', {
  headers: {
    'Accept-Language': 'en-US',
    'X-Request-ID': 'abc123',
  },
});

// On an instance (applied to every request)
const api = axios.create({
  headers: {
    'X-App-Version': '2.0.0',
  },
});
```

## 保留特定的大小写形式

Axios 请求头名称不区分大小写,但 `AxiosHeaders` 会保留它看到的第一个匹配键的大小写。如果面对大小写敏感行为不合标准的服务器需要特定大小写,可以在 defaults 中定义大小写预设,然后照常设置值。

```js
const api = axios.create();

api.defaults.headers.common = {
  'content-type': undefined,
  accept: undefined,
};

await api.put(url, data, {
  headers: {
    'Content-Type': 'application/octet-stream',
    Accept: 'application/json',
  },
});
```

在组合请求头时也可以直接用 `AxiosHeaders` 完成:

```js
import axios, { AxiosHeaders } from 'axios';

const headers = AxiosHeaders.concat(
  { 'content-type': undefined },
  { 'Content-Type': 'application/octet-stream' }
);

await axios.put(url, data, { headers });
```

## 在拦截器中设置请求头

拦截器是附加认证令牌等动态请求头的合适位置,因为令牌在实例首次创建时可能还不可用:

```js
api.interceptors.request.use((config) => {
  const token = getAuthToken(); // read at request time
  config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
```

## Unicode 请求头值

`AxiosHeaders` 会保留请求头值中的非控制 Unicode 字符,因此请求拦截器可以在请求发出前对其进行转换。CR/LF 及其他 C0 控制字节仍会在设置时被剔除,以防请求头注入。

适配器会在把请求头交给底层平台——Node 的 `http.request`、浏览器的 `XMLHttpRequest.setRequestHeader`、`fetch` 的 `Headers`——之前,将其净化为字节安全的字符(HT、可打印 ASCII 和 Latin-1 补充区)。如果请求头值包含超出该范围的字符且你没有自行编码,这些字符会被剔除,可能导致线上出现空值。

如果需要在请求头中发送非 ASCII 数据,请在请求拦截器中编码:

```js
api.interceptors.request.use((config) => {
  if (config.headers.has('X-Name')) {
    config.headers.set('X-Name', encodeURIComponent(config.headers.get('X-Name')));
  }
  return config;
});

await api.get('/api/data', {
  headers: {
    'X-Name': '请求用户',
  },
});
// → request is sent with X-Name: %E8%AF%B7%E6%B1%82%E7%94%A8%E6%88%B7
```

## 读取响应头

响应头以 `AxiosHeaders` 实例的形式位于 `response.headers` 上。所有请求头名称都是小写:

```js
const response = await axios.get('/api/data');

console.log(response.headers['content-type']);
// application/json; charset=utf-8

console.log(response.headers.get('x-request-id'));
// abc123
```

## 移除默认请求头

要停用 axios 默认设置的某个请求头(如 `Content-Type` 或 `User-Agent`),把它的值设为 `false`:

```js
await axios.post('/api/data', payload, {
  headers: {
    'Content-Type': false, // let the browser set it automatically (e.g. for FormData)
  },
});
```

关于 `AxiosHeaders` 完整方法 API 的更多细节,见[请求头方法](/pages/advanced/header-methods)页面。
