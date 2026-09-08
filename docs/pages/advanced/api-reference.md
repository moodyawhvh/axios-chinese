> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。
>
> 注:原文超过 10000 字符,本译文覆盖核心章节;各方法签名与示例代码保持原样。

# API 参考

以下是 axios 包中所有可用函数和类的列表。这些函数可以在你的项目中使用和导入。所有这些函数和类都受我们重申的语义化版本承诺保护:除非发生主版本变更,你可以依赖它们在未来版本中保持稳定、不被改动。

## 实例(Instance)

`axios` 实例是你发起 HTTP 请求所用的主要对象。它是一个工厂函数,用于创建 `Axios` 类的新实例。`axios` 实例拥有许多可用于发起 HTTP 请求的方法,这些方法在文档的[请求别名](/pages/advanced/request-method-aliases)一节中说明。

## TypeScript 请求类型

公开的请求类型为请求数据和查询参数使用独立的泛型:

```ts
AxiosRequestConfig<D = any, P = any>
RawAxiosRequestConfig<D = any, P = any>
InternalAxiosRequestConfig<D = any, P = any>
AxiosDefaults<D = any, P = any>
CreateAxiosDefaults<D = any, P = any>

AxiosResponse<T = any, D = any, H = {}, P = any>
AxiosPromise<T = any, D = any, P = any>
AxiosError<T = unknown, D = any, P = any>
CanceledError<T, D = any, P = any>
```

`D` 是请求体类型,`P` 是查询参数类型。`AxiosResponse`、`AxiosPromise`、各类错误、defaults、可调用实例、请求别名、适配器以及 `mergeConfig()` 都会在请求配置上保留这两者。自定义 params 序列化器接收同样的 `P`。

请求方法使用泛型顺序 `<T, R, D, P>`,`P` 添加在最后,因此已有的显式泛型参数保持兼容。当未提供自定义响应类型 `R` 时,resolved 的 `AxiosResponse` 会在 `response.config` 上保留 `D` 和 `P`;显式提供的 `R` 仍决定 resolve 的值。为了向后兼容,所有请求数据与 params 泛型默认为 `any`。

## 类(Classes)

### `Axios`

`Axios` 类是发起 HTTP 请求所用的主要类。它是一个工厂函数,用于创建 `Axios` 类的新实例。`Axios` 类拥有许多可用于发起 HTTP 请求的方法,这些方法在文档的[请求别名](/pages/advanced/request-method-aliases)一节中说明。

#### `constructor`

创建 `Axios` 类的新实例。构造函数接受一个可选的配置对象作为参数。

```ts
constructor(instanceConfig?: AxiosRequestConfig);
```

#### `request`

处理请求调用与响应 resolve。这是发起 HTTP 请求的主要方法。它接受一个配置对象作为参数,返回一个 resolve 为响应对象的 Promise。

```ts
request<T, R, D, P>(config: AxiosRequestConfig<D, P>): Promise<R>;
```

### `CancelToken` <Badge type="danger" text="已废弃,请改用 AbortController" />

`CancelToken` 类基于 `tc39/proposal-cancelable-promises` 提案,曾用于创建可取消 HTTP 请求的令牌。该类现已废弃,推荐改用 `AbortController` API。

自 0.22.0 版本起,`CancelToken` 类已废弃,并将在未来版本中移除。它主要为向后兼容而导出;强烈不建议在新项目中使用。

遗留方法仍为现有集成保留了类型:

```ts
subscribe(listener: (cancel: Cancel | any) => void): void;
unsubscribe(listener: (cancel: Cancel | any) => void): void;
toAbortSignal(): AbortSignal;
```

## 函数(Functions)

### `AxiosError`

`AxiosError` 是 HTTP 请求失败时抛出的错误类。它继承自 `Error` 类,并在错误对象上增加了额外属性。

#### `constructor`

创建 `AxiosError` 类的新实例。构造函数接受可选的 message、code、config、request 和 response 作为参数。

```ts
constructor(message?: string, code?: string, config?: InternalAxiosRequestConfig<D, P>, request?: any, response?: AxiosResponse<T, D, {}, P>);
```

#### `properties`

`AxiosError` 类提供以下属性:

```ts
// Config instance.
config?: InternalAxiosRequestConfig<D, P>;

// Error code.
code?: string;

// Request instance.
request?: any;

// Response instance.
response?: AxiosResponse<T, D, {}, P>;

// Boolean indicating if the error is an `AxiosError`.
isAxiosError: boolean;

// Error status code.
status?: number;

// Helper method to convert the error to a JSON object.
toJSON: () => object;

// Error cause.
cause?: Error;
```

### `AxiosHeaders`

`AxiosHeaders` 是用于管理 HTTP 请求头的工具类。它提供了操作请求头的方法,如添加、移除和获取请求头。

这里只记录主要方法。完整方法列表请参阅类型声明文件。

#### `constructor`

创建 `AxiosHeaders` 类的新实例。构造函数接受一个可选的 headers 对象作为参数。

```ts
constructor(headers?: RawAxiosHeaders | AxiosHeaders | string);
```

#### `set`

向 headers 对象添加请求头。空名称或纯空白名称会被忽略。

```ts
set(headerName?: string, value?: AxiosHeaderValue, rewrite?: boolean | AxiosHeaderMatcher): AxiosHeaders;
set(headers?: RawAxiosHeaders | AxiosHeaders | string, rewrite?: boolean): AxiosHeaders;
set(headers?: Iterable<[string, AxiosHeaderValue]>, rewrite?: boolean): AxiosHeaders;
```

#### `get`

从 headers 对象获取请求头。

```ts
get(headerName: string, parser: typeof AxiosHeaders.parseParameters): AxiosHeaderParameters;
get(headerName: string, parser: RegExp): RegExpExecArray | null;
get(headerName: string, matcher?: true | AxiosHeaderParser): AxiosHeaderValue;
```

传入 `AxiosHeaders.parseParameters` 可以把规范化后的 HTTP 参数解析为加固的 null-prototype 映射:

```js
const headers = new AxiosHeaders({
  "Content-Type": 'multipart/form-data; boundary="a,b"',
});

console.log({
  ...headers.get("Content-Type", AxiosHeaders.parseParameters),
});
// { boundary: "a,b" }
```

参数名不区分大小写。该解析器会移除带引号字符串的分隔符,解码转义的引号和反斜杠,保留引号值内的逗号和分号,并且只对未加引号的值去除 RFC 可选空白。`__proto__`、`constructor` 和 `prototype` 会被忽略。`get(name, true)` 仍是遗留分词器。

#### `has`

检查 headers 对象中是否存在某个请求头。

```ts
has(header: string, matcher?: AxiosHeaderMatcher): boolean;
```

#### `delete`

从 headers 对象移除请求头。

```ts
delete(header: string | string[], matcher?: AxiosHeaderMatcher): boolean;
```

#### `clear`

移除 headers 对象中的所有请求头。

```ts
clear(matcher?: AxiosHeaderMatcher): boolean;
```

#### `normalize`

规范化 headers 对象。

```ts
normalize(format: boolean): AxiosHeaders;
```

#### `concat`

拼接多个 headers 对象。

```ts
concat(...targets: Array<AxiosHeaders | RawAxiosHeaders | string | undefined | null>): AxiosHeaders;
```

#### `toJSON`

将 headers 对象转换为 JSON 对象。

```ts
toJSON(asStrings: true): Record<string, string>;
toJSON(asStrings?: false): Record<string, string | string[]>;
```

#### `toString`

以无 CRLF 的 HTTP 请求头块形式返回请求头,每行一对 `name: value`。

```ts
toString(): string;
```

### `CanceledError` <Badge type="tip" text="扩展自 AxiosError" />

`CanceledError` 是 HTTP 请求被取消时抛出的错误类。它继承自 `AxiosError` 类。

```ts
constructor(message?: string, config?: InternalAxiosRequestConfig<D, P>, request?: any);
__CANCEL__?: boolean;
```

### `Cancel` <Badge type="tip" text="CanceledError 的别名" />

`Cancel` 类是 `CanceledError` 类的别名,为向后兼容而导出,将在未来版本中移除。

```ts
Cancel: typeof CanceledError;
```

### `isCancel`

检查一个错误是否为 `CanceledError` 的函数。用于区分主动取消与意外错误。

```ts
isCancel<T = any, D = any, P = any>(value: any): value is CanceledError<T, D, P>;
```

```js
import axios from 'axios';

const controller = new AbortController();

axios.get('/api/data', { signal: controller.signal }).catch((error) => {
  if (axios.isCancel(error)) {
    console.log('Request was cancelled:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
});

controller.abort('User navigated away');
```

### `isAxiosError`

检查一个错误是否为 `AxiosError` 的函数。在 `catch` 块中使用它,即可安全地访问 `error.response`、`error.config` 等 axios 特有的错误属性。

```ts
isAxiosError(value: any): value is AxiosError;
```

```js
import axios from 'axios';

try {
  await axios.get('/api/resource');
} catch (error) {
  if (axios.isAxiosError(error)) {
    // error.response, error.config, error.code are all available
    console.error('HTTP error', error.response?.status, error.message);
  } else {
    // A non-axios error (e.g. a programming mistake)
    throw error;
  }
}
```

### `all` <Badge type="danger" text="已废弃,请改用 Promise.all" />

`all` 函数接受一个 Promise 数组,返回一个在数组中所有 Promise 都 resolve 后才 resolve 的单一 Promise。该函数现已废弃,推荐改用 `Promise.all` 方法。

自 0.22.0 版本起,`all` 函数已废弃,并将在未来版本中移除。

### `spread`

`spread` 函数用于把参数数组展开到一个函数调用中。当你有一组参数想传给一个接受多个参数的函数时,它非常有用。

```ts
spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
```

### `toFormData`

把普通 JavaScript 对象(或嵌套对象)转换为 `FormData` 实例。适合以编程方式从对象构建 multipart 表单数据。

```ts
toFormData(sourceObj: object, formData?: FormData, options?: FormSerializerOptions): FormData;
```

```js
import { toFormData } from 'axios';

const data = { name: 'Jay', avatar: fileBlob };
const form = toFormData(data);
// form is now a FormData instance ready to post
await axios.post('/api/users', form);
```

### `formToJSON`

把 `FormData` 实例转换回普通 JavaScript 对象。适合以结构化格式读取表单数据。

只有点号记法和方括号记法具有结构含义:`.`、`[`、`]` 会拆分路径,而 `-`、空格、`+`、`*`、`&` 保留为字面键。`foo.bar` 和 `foo[bar]` 创建嵌套对象,`foo[]` 创建数组。

```ts
formToJSON(form: FormData): object;
```

```js
import { formToJSON } from 'axios';

const form = new FormData();
form.append('user-name', 'johndoe');
form.append('user.name', 'john');

const obj = formToJSON(form);
console.log(obj);
// { "user-name": "johndoe", user: { name: "john" } }
```

### `getAdapter`

按名称解析并返回适配器函数,也可以传入候选名称数组。axios 内部使用它为当前环境选择最佳可用适配器。

```ts
getAdapter(adapters: string | string[]): AxiosAdapter;
```

```js
import { getAdapter } from 'axios';

// Get the fetch adapter explicitly
const fetchAdapter = getAdapter('fetch');

// Get the best available adapter from a priority list
const adapter = getAdapter(['fetch', 'xhr', 'http']);
```

### `mergeConfig`

合并两个 axios 配置对象,应用与 axios 内部合并 defaults 和单次请求选项时相同的深度合并策略。后面的值优先。

```ts
mergeConfig<D = any, P = any>(
  config1: AxiosRequestConfig<D, P>,
  config2: AxiosRequestConfig<D, P>
): AxiosRequestConfig<D, P>;
```

```js
import { mergeConfig } from 'axios';

const base = { baseURL: 'https://api.example.com', timeout: 5000 };
const override = { timeout: 10000, headers: { 'X-Custom': 'value' } };

const merged = mergeConfig(base, override);
// { baseURL: "https://api.example.com", timeout: 10000, headers: { "X-Custom": "value" } }
```

## 常量(Constants)

### `HttpStatusCode`

一个以命名常量形式列出 HTTP 状态码的对象。用它编写条件判断,比裸数字更易读。

```js
import axios, { HttpStatusCode } from 'axios';

try {
  const response = await axios.get('/api/resource');
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === HttpStatusCode.NotFound) {
      console.error('Resource not found');
    } else if (error.response?.status === HttpStatusCode.Unauthorized) {
      console.error('Authentication required');
    }
  }
}
```

## 其他(Miscellaneous)

### `VERSION`

`axios` 包的当前版本。这是一个表示包版本号的字符串,随每次发布更新。
