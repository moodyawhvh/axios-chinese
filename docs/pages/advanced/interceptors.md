> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 拦截器

拦截器是一种强大的机制,用于拦截并修改 HTTP 请求和响应,与 Express.js 中的中间件非常相似。拦截器是一个函数,在请求发出之前和响应到达之后执行。它适用于多种场景,例如记录日志、修改请求头、修改响应等。

拦截器的基本用法如下:

```js
// 添加请求拦截器
axios.interceptors.request.use(
  function (config) {
    // 在请求发出前做些处理
    return config;
  },
  function (error) {
    // 对请求错误做些处理
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数
    // 对响应数据做些处理
    return response;
  },
  function (error) {
    // 超出 2xx 范围的状态码都会触发该函数
    // 对响应错误做些处理
    return Promise.reject(error);
  }
);
```

## 移除拦截器

可以在要移除的拦截器上调用 `eject` 方法来移除它,也可以调用 `axios.interceptors` 对象上的 `clear` 方法移除全部拦截器。下面是移除拦截器的示例:

```js
// 移除请求拦截器
const myInterceptor = axios.interceptors.request.use(function () {
  /*...*/
});
axios.interceptors.request.eject(myInterceptor);

// 移除响应拦截器
const myInterceptor = axios.interceptors.response.use(function () {
  /*...*/
});
axios.interceptors.response.eject(myInterceptor);
```

下面是移除全部拦截器的示例:

```js
const instance = axios.create();
instance.interceptors.request.use(function () {
  /*...*/
});
instance.interceptors.request.clear(); // 移除请求拦截器
instance.interceptors.response.use(function () {
  /*...*/
});
instance.interceptors.response.clear(); // 移除响应拦截器
```

## 拦截器的默认行为

添加请求拦截器时,默认假定它是异步的。当主线程被阻塞时,这会导致 axios 请求的执行出现延迟(拦截器底层会创建 Promise,请求会被压到调用栈底部)。如果你的请求拦截器是同步的,可以在 options 对象上加一个标志,告诉 axios 同步执行这段代码,避免请求执行的延迟。

```js
axios.interceptors.request.use(
  function (config) {
    config.headers.test = "I am only a header!";
    return config;
  },
  null,
  { synchronous: true }
);
```

### 同步拦截器的错误

当同步请求拦截器抛出异常时,axios 会调用该拦截器配对的 `onRejected` 处理器,并停止执行其余请求拦截器。如果该处理器正常返回——包括返回 `undefined` 或已 fulfilled 的 Promise——错误即被视为已处理,axios 会使用最后一个有效配置派发请求;处理器的返回值不会替换该配置。

若要阻止请求派发,请省略 rejection 处理器,或让它抛出异常/返回 rejected Promise。此时终结性错误会继续进入响应 rejection 拦截器。

当校验必须阻断请求时,使用 rejected Promise:

```js
axios.interceptors.request.use(
  function validate(config) {
    if (!config.headers.has("Authorization")) {
      throw new Error("Authorization is required");
    }
    return config;
  },
  function rejectInvalidRequest(error) {
    return Promise.reject(error);
  },
  { synchronous: true }
);
```

仅用于记录日志的 rejection 处理器可以正常返回,以保留现有的继续执行行为:

```js
axios.interceptors.request.use(
  function prepare(config) {
    throw new Error("Optional preparation failed");
  },
  function logPreparationFailure(error) {
    console.warn(error);
    // 正常返回会以最后一个有效配置继续派发请求。
  },
  { synchronous: true }
);
```

## 使用 `runWhen` 的拦截器

如果想根据运行时条件决定是否执行某个拦截器,可以在 options 对象中添加 runWhen 函数。当且仅当 runWhen 返回 false 时,拦截器不会执行。该函数会接收 config 对象作为参数(别忘了还可以给它绑定自己的参数)。当你有一个只在特定情况下才需要运行的异步请求拦截器时,这会非常有用。

```js
function onGetCall(config) {
  return config.method === "get";
}
axios.interceptors.request.use(
  function (config) {
    config.headers.test = "special get headers";
    return config;
  },
  null,
  { runWhen: onGetCall }
);
```

## 拦截器的执行顺序

::: warning 请求与响应拦截器的执行顺序**相反**
请求拦截器按**添加的逆序**执行(LIFO——后进先出)。_最后_ 添加的请求拦截器 _最先_ 执行。

响应拦截器按**添加顺序**执行(FIFO——先进先出)。_最先_ 添加的响应拦截器 _最先_ 执行。
:::

下面的示例展示了三个请求拦截器和三个响应拦截器的完整执行顺序:

```js
const instance = axios.create();

const interceptor = (id) => (base) => {
  console.log(id);
  return base;
};

instance.interceptors.request.use(interceptor("Request Interceptor 1"));
instance.interceptors.request.use(interceptor("Request Interceptor 2"));
instance.interceptors.request.use(interceptor("Request Interceptor 3"));
instance.interceptors.response.use(interceptor("Response Interceptor 1"));
instance.interceptors.response.use(interceptor("Response Interceptor 2"));
instance.interceptors.response.use(interceptor("Response Interceptor 3"));

// 控制台输出:
// Request Interceptor 3
// Request Interceptor 2
// Request Interceptor 1
// [发出 HTTP 请求]
// Response Interceptor 1
// Response Interceptor 2
// Response Interceptor 3
```

## 多个拦截器

你可以为同一个请求或响应添加多个拦截器。同一链条中的多个拦截器按添加顺序满足以下规则:

- 每个拦截器都会执行
- 请求拦截器按逆序执行(LIFO)。
- 响应拦截器按添加顺序执行(FIFO)。
- 只有最后一个拦截器的结果会被返回
- 每个拦截器接收前一个拦截器的结果
- 当 fulfillment 拦截器抛出异常时
  - 后续的 fulfillment 拦截器不会被调用
  - 后续的 rejection 拦截器会被调用
  - 一旦被捕获,再往后的 fulfillment 拦截器会重新被调用(与 Promise 链一致)。

::: tip
想深入了解拦截器的工作原理,可以阅读[这里的测试用例](https://github.com/axios/axios/blob/v1.x/test/specs/interceptors.spec.js)。
:::
