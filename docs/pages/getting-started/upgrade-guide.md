> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 升级指南

本指南旨在帮助你将项目从一个版本升级到另一个版本。建议阅读你所升级来源/目标大版本的发行说明,其中可能包含关于破坏性变更的重要信息。

## 升级到 v1.19.0

### 畸形的 HTTP(S) URL 会被拒绝

现在,请求会拒绝协议后缺少 `//` 的 `http:` 或 `https:` `url` 或 `baseURL`。请将 `https:example.com`、`https:/example.com` 之类的值替换为 `https://example.com` 这样格式正确的 URL。产生的 `AxiosError` 使用错误码 `ERR_INVALID_URL`,并给出经过安全脱敏的违规 URL。这一有意为之的安全变更,可防止畸形 URL 的规范化处理绕过 `baseURL` 或 URL 白名单。

### 同步请求拦截器抛错的行为

当同步请求拦截器抛出异常时,axios 会调用与之配对的 rejection 处理器,并停止执行后续的请求拦截器。如果 rejection 处理器正常返回,则视为已处理该错误,并使用最后一个有效配置继续派发请求;其返回值不会成为请求配置。如果校验逻辑必须阻断请求派发,请省略 rejection 处理器,或在其中抛出异常/返回 rejected Promise。终结性错误会继续进入响应 rejection 拦截器。

## 从 v0.x 升级到 v1.x

### import 语句的变化

v1.x 中,import 语句改为使用 `default` 导出。你需要更新 import 语句以使用 `default` 导出。

```diff
- import { axios } from "axios";
+ import axios from "axios";
```

### 拦截器系统的变化

v1.x 中,`request` 拦截器的 `config` 参数需要使用 `InternalAxiosRequestConfig` 类型来标注,因为该参数现在的类型是 `InternalAxiosRequestConfig`,而不是公开的 `AxiosRequestConfig` 类型。

```diff
- axios.interceptors.request.use((config: AxiosRequestConfig) => {
+ axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    return config;
  });
```

### 请求头结构的变化

v1.x 中,请求头的结构发生了变化,移除了 `common` 属性。你需要按新的请求头结构更新代码:

```diff
- if (request.headers?.common?.Authorization) {
-       request.headers.common.Authorization = ...
+ if (request.headers?.Authorization) {
+       request.headers.Authorization = ...
```

原来位于 `common`、`get`、`post` 等下面的默认请求头,现在直接设置在 `axios.defaults.headers` 上:

```diff
- axios.defaults.headers.common["Accept"] = "application/json";
+ axios.defaults.headers["Accept"] = "application/json";
```

### Multipart 表单数据

如果请求包含 `FormData` 载荷,现在会自动设置 `Content-Type: multipart/form-data` 请求头。请移除手动设置的请求头,避免重复:

```diff
- axios.post("/upload", formData, {
-   headers: { "Content-Type": "multipart/form-data" },
- });
+ axios.post("/upload", formData);
```

如果你显式设置 `Content-Type: application/json`,axios 现在会自动将数据序列化为 JSON。

### 参数序列化

v1.x 对 URL 参数的序列化方式引入了若干破坏性变更,最重要的几点:

**`params` 默认进行百分号编码。** 如果你的后端期望 qs 风格编码的原始方括号,可能需要配置自定义序列化器:

```js
import qs from 'qs';

axios.create({
  paramsSerializer: {
    serialize: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  },
});
```

**`params` 中的嵌套对象现在使用方括号记法序列化**(`foo[bar]=1`),而不是点记法。如果后端期望点记法,请使用自定义序列化器。

**`null` 和 `undefined` 参数**现在行为一致:`null` 值序列化为空字符串,`undefined` 值则完全省略。

完整的参数序列化配置选项见[请求配置](/pages/advanced/request-config)页面。

### 内部实现不再导出

我们决定不再导出 axios 的内部实现。这意味着你的代码只能使用 axios 的公开 API。做出这一变更是为了简化 API、缩小 axios 的暴露面,使我们可以在不声明破坏性变更的情况下调整内部实现。

请查阅本站的 [API 参考](/pages/advanced/api-reference)获取 axios 公开 API 的最新信息。

### 请求配置

请求配置对象也有变更。请查阅本站的[配置参考](/pages/advanced/request-config)获取最新信息。

### 遗漏的破坏性变更

本指南并非详尽无遗,可能无法覆盖所有破坏性变更。如果你遇到问题,请到[文档 GitHub 仓库](https://github.com/axios/docs)提 issue,并打上 `breaking change` 标签。
