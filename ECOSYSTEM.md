> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 生态系统

这里是 axios 相关库与资源的清单。想添加条目,请发起 pull request。

## 库

### 通用

- [axios-vcr](https://github.com/nettofarah/axios-vcr) - 录制并回放 axios 请求
- [@3846masa/axios-cookiejar-support](https://github.com/3846masa/axios-cookiejar-support) - 为 axios 增加 tough-cookie 支持
- [axios-method-override](https://github.com/jacobbuck/axios-method-override) - 覆写 axios 中的 HTTP 请求方法
- [axios-cache-plugin](https://github.com/jin5354/axios-cache-plugin) - 缓存 axios 发出的 GET 请求
- [axios-extensions](https://github.com/kuitos/axios-extensions) - axios 扩展集,包括节流和 GET 请求缓存
- [axios-fetch](https://github.com/lifeomic/axios-fetch) - 提供由 axios 客户端驱动的 Web API Fetch 实现
- [axios-actions](https://github.com/davestewart/axios-actions) - 将端点打包成可调用、可复用的服务
- [axios-api-versioning](https://weffe.github.io/axios-api-versioning) - 为 axios 增加 API 版本管理
- [axios-data-unpacker](https://github.com/anubhavsrivastava/axios-data-unpacker) - 通过 axios 拦截器解包 HTTP 响应
- [r2curl](https://github.com/uyu423/r2curl) - 从 axios 对象(AxiosResponse、AxiosRequestConfig)提取 cURL 命令字符串
- [axios-endpoints](https://github.com/renancaraujo/axios-endpoints) - 为 axios 定义简洁的端点映射
- [axios-multi-api](https://github.com/MattCCC/axios-multi-api) - 用声明式的 axios 请求定义管理多个 API
- [axios-url-template](https://github.com/rafw87/axios-url-template) - 通过 axios 拦截器增加 URL 模板支持

### API 客户端

- [@hey-api/openapi-ts](https://heyapi.dev/openapi-ts/clients/axios) - 从 OpenAPI 模式生成 TypeScript 客户端、SDK 与校验器
- [swagger-taxos-codegen](https://github.com/michalzaq12/swagger-taxos-codegen) - 生成基于 axios 的 TypeScript Swagger 客户端
- [zodios](https://www.zodios.org) - 基于 axios 的类型安全 API 客户端

### 日志与调试

- [axios-response-logger](https://github.com/srph/axios-response-logger) - 通过 axios 拦截器记录响应日志
- [axios-debug-log](https://github.com/Gerhut/axios-debug-log) - 使用 debug 记录 axios 请求与响应
- [axios-curlirize](https://www.npmjs.com/package/axios-curlirize) - 将 axios 请求记录为 cURL 命令,并把命令附加到响应对象上

### React 与 redux

- [axios-hooks](https://github.com/simoneb/axios-hooks) - axios 的 React hooks,内置服务端渲染支持
- [react-hooks-axios](https://github.com/use-hooks/react-hooks-axios) - axios 的自定义 React hooks
- [redux-saga-requests](https://github.com/klis87/redux-saga-requests) - 处理 AJAX 请求的 Redux-Saga 插件
- [redux-axios-middleware](https://github.com/svrcekmichal/redux-axios-middleware) - 使用 axios HTTP 客户端取数的 Redux 中间件
- [@react-cmpt/react-request-hook](https://github.com/react-cmpt/react-request-hook) - 轻量级 axios React hook 插件,几乎无需改动代码

### 单元测试

- [axiosist](https://github.com/Gerhut/axiosist) - 将 Node.js 请求处理器转换为 axios 适配器,用于服务端单元测试
- [axios-mock-adapter](https://github.com/ctimmerm/axios-mock-adapter) - 通过自定义适配器模拟 axios 请求
- [axios-test-instance](https://github.com/remcohaszing/axios-test-instance) - 用 axios 测试 Node.js 后端
- [moxios](https://github.com/axios/moxios) - 模拟 axios 请求用于测试
- [mocha-axios](https://github.com/jdrydn/mocha-axios) - 简化 Mocha 与 axios 的集成测试
