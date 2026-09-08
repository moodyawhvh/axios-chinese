> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 特性

axios 是一个强大的 HTTP 客户端,为发送 HTTP 请求提供了简单易用的 API。它支持所有现代浏览器,在 JavaScript 社区中被广泛使用。以下这些特性让 axios 成为你的下一个项目的绝佳选择。

## 同构(Isomorphic)

axios 是一个通用 HTTP 客户端,既能在浏览器中使用,也能在 Node.js 中使用。这意味着无论前端代码还是后端代码,都可以用 axios 发起 API 请求。因此 axios 非常适合构建渐进式 Web 应用、单页应用(SSPA)以及服务端渲染应用。

对于同时负责前端和后端的团队,axios 也是很好的选择:前后端统一使用 axios 发起 HTTP 请求,可以获得一致的 API 体验,有助于降低代码库的复杂度。

## Fetch 支持 <Badge type="tip" text="New" />

axios 对 Fetch API 提供一等公民支持。Fetch API 是 XHR API 的现代替代方案。该适配器是可选的,可通过配置启用。XHR 与 Fetch 两个适配器保持相同的 API,因此你无需修改现有代码即可轻松在代码库中采用 Fetch API。

## 浏览器支持

axios 支持所有现代浏览器及部分旧版浏览器,包括 Chrome、Firefox、Safari 和 Edge。对于需要兼容广泛浏览器的 Web 应用,axios 是很好的选择。

## Node.js 支持

axios 还支持多种 Node.js 版本,经过测试可兼容到 v12.x,因此在无法或不宜升级到最新 Node.js 版本的环境中也是不错的选择。

除 Node.js 外,axios 还有 Bun 和 Deno 冒烟测试,用于验证关键运行时行为,增强跨运行时兼容性的信心。

## 更多特性

- 支持 Promise API
- 拦截请求与响应
- 转换请求数据与响应数据
- 支持 AbortController 取消
- 超时控制
- 查询参数序列化,支持嵌套条目
- 自动将请求体序列化为:
  - JSON(application/json)
  - Multipart / FormData(multipart/form-data)
  - URL 编码表单(application/x-www-form-urlencoded)
- 将 HTML 表单以 JSON 提交
- 自动处理响应中的 JSON 数据
- 在浏览器和 Node.js 中捕获进度,并提供额外信息(速率、剩余时间)
- 支持 Node.js 带宽限制
- 兼容符合规范的 FormData 与 Blob(包括 Node.js)
- 客户端 XSRF 防护
