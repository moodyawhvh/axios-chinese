> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 适配器(Adapters)

适配器让你可以自定义 axios 处理请求数据的方式。默认情况下,axios 使用有序优先级列表 `['xhr', 'http', 'fetch']`,并选择当前环境支持的第一个适配器。实际效果是:浏览器中使用 `xhr`,Node.js 中使用 `http`,两者都不可用的环境(如 Cloudflare Workers 或 Deno)中使用 `fetch`。

编写自己的适配器可以让你完全控制 axios 如何发起请求和处理响应——这对测试、自定义传输层或非标准环境非常有用。

## 内置适配器

可以通过 `adapter` 配置项按名称选择内置适配器:

```js
// Use the fetch adapter
const instance = axios.create({ adapter: "fetch" });

// Use the XHR adapter (browser default)
const instance = axios.create({ adapter: "xhr" });

// Use the HTTP adapter (Node.js default)
const instance = axios.create({ adapter: "http" });
```

也可以传入适配器名称数组,axios 会使用当前环境支持的第一个:

```js
const instance = axios.create({ adapter: ["fetch", "xhr", "http"] });
```

关于 `fetch` 适配器的更多细节,见 [Fetch 适配器](/pages/advanced/fetch-adapter)页面。

## 创建自定义适配器

要创建自定义适配器,编写一个接受 `config` 对象并返回 Promise 的函数即可,该 Promise 需 resolve 为一个合法的 axios 响应对象。

```js
import axios from "axios";
import { settle } from "axios/unsafe/core/settle.js";

function myAdapter(config) {
  /**
   * At this point:
   * - config has been merged with defaults
   * - request transformers have run
   * - request interceptors have run
   *
   * The adapter is now responsible for making the request
   * and returning a valid response object.
   */

  return new Promise((resolve, reject) => {
    // Perform your custom request logic here.
    // This example uses the native fetch API as a starting point.
    fetch(config.url, {
      method: config.method?.toUpperCase() ?? "GET",
      headers: config.headers?.toJSON() ?? {},
      body: config.data,
      signal: config.signal,
    })
      .then(async (fetchResponse) => {
        const responseData = await fetchResponse.text();

        const response = {
          data: responseData,
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          headers: Object.fromEntries(fetchResponse.headers.entries()),
          config,
          request: null,
        };

        // settle resolves or rejects the promise based on the HTTP status
        settle(resolve, reject, response);

        /**
         * After this point:
         * - response transformers will run
         * - response interceptors will run
         */
      })
      .catch(reject);
  });
}

const instance = axios.create({ adapter: myAdapter });
```

TypeScript 适配器可以使用对应的泛型,在响应的 config 上保留请求数据和查询参数的类型:

```ts
import type {
  AxiosPromise,
  InternalAxiosRequestConfig,
} from "axios";

interface RequestBody {
  includeArchived: boolean;
}

interface SearchParams {
  query: string;
}

interface SearchResponse {
  results: string[];
}

const searchAdapter = (
  config: InternalAxiosRequestConfig<RequestBody, SearchParams>
): AxiosPromise<SearchResponse, RequestBody, SearchParams> =>
  Promise.resolve({
    data: { results: [] },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
```

::: tip
`settle` 辅助函数对 2xx 状态码 resolve Promise,对其余状态码 reject,与 axios 的默认行为一致。如果你想自定义状态码校验逻辑,请改用 `validateStatus` 配置项。
:::
