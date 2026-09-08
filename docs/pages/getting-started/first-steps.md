> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 起步

欢迎来到 axios 文档!本指南将帮助你快速上手 axios,并发出第一个 API 请求。如果你刚接触 axios,建议从这里开始阅读。

## 安装

你可以通过多种方式在项目中使用 axios。最常见的方式是通过 npm 安装并引入项目。此外,我们还支持 jsDelivr、unpkg 等方式。

#### 使用 npm

```bash
npm install axios
```

#### 使用 pnpm

```bash
pnpm install axios
```

#### 使用 yarn

```bash
yarn add axios
```

#### 使用 bun

```bash
bun add axios
```

#### 使用 deno

```bash
deno install npm:axios
```

#### 使用 jsDelivr

使用 jsDelivr 时,建议使用压缩版并固定版本号,以避免意料之外的变动。如果你想使用最新版本,可以去掉版本号,但强烈不建议在生产环境这样做,因为可能给你的应用带来不可预期的变化。

```html
<script src="https://cdn.jsdelivr.net/npm/axios@<x.x.x>/dist/axios.min.js"></script>
```

#### 使用 unpkg

使用 unpkg 时,同样建议使用压缩版并固定版本号,以避免意料之外的变动。如果想使用最新版本,可以去掉版本号,但强烈不建议在生产环境这样做,因为可能给你的应用带来不可预期的变化。

```html
<script src="https://unpkg.com/axios@<x.x.x>/dist/axios.min.js"></script>
```

## 引入 axios

安装完成后,你可以使用 `import` 或 `require` 引入该库:

```js
import axios, { isCancel, AxiosError } from "axios";
```

也可以只使用默认导出,因为命名导出本质上只是 axios 工厂函数的再导出:

```js
import axios from "axios";

console.log(axios.isCancel("something"));
```

如果你使用 `require` 引入,**则只有默认导出可用**:

```js
const axios = require("axios");

console.log(axios.isCancel("something"));
```

某些打包器和 ES6 lint 工具可能需要这样写:

```js
import { default as axios } from "axios";
```

对于模块解析行为异常的自定义或遗留环境,你可以直接引入预构建的 bundle:

```js
const axios = require("axios/dist/browser/axios.cjs"); // 浏览器 CommonJS bundle(ES2017)
// const axios = require("axios/dist/node/axios.cjs"); // Node CommonJS bundle(ES2017)
```

## 发出第一个请求

一个 axios 请求最少只需要两行代码。用 axios 发出第一个请求非常简单:只要提供 URL 和请求方法,就可以请求任何 API。例如,向 JSONPlaceholder API 发送一个 GET 请求:

```js
import axios from "axios";

const response = await axios.get(
  "https://jsonplaceholder.typicode.com/posts/1"
);

console.log(response.data);
```

axios 提供了一套简洁的请求 API:使用 `axios.get` 方法发送 GET 请求,使用 `axios.post` 方法发送 POST 请求,依此类推。你也可以使用 `axios.request` 方法以任意方法发起请求。

::: tip 在生产环境中设置超时
如果不设置 `timeout`,一个停滞的请求可能无限挂起。请通过请求配置传入超时:

```js
const response = await axios.get("https://example.com/data", {
  timeout: 5000, // 5 秒
});
```

对应的 `ECONNABORTED` / `ETIMEDOUT` 错误码可参见[请求配置中的 `timeout`](/pages/advanced/request-config#timeout) 与[错误处理](/pages/advanced/error-handling)。
:::

## 下一步

现在已经发出了第一个 axios 请求,接下来可以继续探索 axios 文档的其余内容:学习如何发请求、处理响应,以及如何在你的项目中使用 axios。请查阅其余文档以了解更多。
