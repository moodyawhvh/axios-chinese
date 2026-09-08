> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 取消请求(Cancellation)

从 v0.22.0 开始,Axios 支持 AbortController 以一种干净的方式取消请求。该特性在浏览器中可用;在 Node.js 中,只要所用的 Axios 版本支持 AbortController 即可使用。要取消请求,需要创建一个 `AbortController` 实例,并把它的 `signal` 传给请求的 `signal` 选项。

```js
const controller = new AbortController();

axios
  .get('/foo/bar', {
    signal: controller.signal,
  })
  .then(function (response) {
    //...
  });
// cancel the request
controller.abort();
```

## CancelToken <Badge type="danger" text="已废弃" />

你也可以使用 `CancelToken` API 取消请求。该 API 已废弃,将在下一个主版本中移除,建议改用 `AbortController`。可以使用 `CancelToken.source` 工厂函数创建取消令牌,如下所示:

```js
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios
  .get('/user/12345', {
    cancelToken: source.token,
  })
  .catch(function (thrown) {
    if (axios.isCancel(thrown)) {
      console.log('Request canceled', thrown.message);
    } else {
      // handle error
    }
  });

axios.post(
  '/user/12345',
  {
    name: 'new name',
  },
  {
    cancelToken: source.token,
  }
);

// cancel the request (the message parameter is optional)
source.cancel('Operation canceled by the user.');
```

也可以向 `CancelToken` 构造函数传入 executor 函数来创建取消令牌:

```js
const CancelToken = axios.CancelToken;
let cancel;

axios.get('/user/12345', {
  cancelToken: new CancelToken(function executor(c) {
    // An executor function receives a cancel function as a parameter
    cancel = c;
  }),
});

// cancel the request
cancel();
```

`CancelToken` 还为遗留集成暴露了底层辅助方法:

```js
const source = axios.CancelToken.source();

const listener = (cancel) => {
  console.log(cancel.message);
};

source.token.subscribe(listener);

const signal = source.token.toAbortSignal();
// Pass `signal` to APIs that accept AbortSignal.

source.cancel('Operation canceled by the user.');
source.token.unsubscribe(listener);
```

被取消的请求会以 `axios.CanceledError` reject。遗留的 `axios.Cancel` 导出是 `axios.CanceledError` 的别名,取消错误带有 `__CANCEL__` 属性以兼容 `axios.isCancel`。

在 TypeScript 中,`isCancel<T, D, P>()` 在收窄 `unknown` 错误类型的同时,会保留响应数据、请求数据和查询参数的类型:

```ts
interface SearchResponse {
  results: string[];
}

interface RequestBody {
  includeArchived: boolean;
}

interface SearchParams {
  query: string;
}

try {
  await axios.get("/search");
} catch (error) {
  if (axios.isCancel<SearchResponse, RequestBody, SearchParams>(error)) {
    error.response?.data; // SearchResponse | undefined
    error.config?.data;   // RequestBody | undefined
    error.config?.params; // SearchParams | undefined
  }
}
```

你可以用同一个取消令牌/abort controller 取消多个请求。如果在发起 Axios 请求时取消令牌已被取消,则该请求会立即被取消,不会尝试发出真实请求。
