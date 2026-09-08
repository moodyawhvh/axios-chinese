> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# TypeScript

`axios` 通过 npm 包中的 `index.d.ts`(ESM)和 `index.d.cts`(CJS)附带 TypeScript 类型定义,因此两种模块格式都能开箱即用地获得类型检查和编辑器支持。

## 模块解析注意事项

由于 axios 以"ESM 默认导出 + CJS `module.exports`"双格式发布,有几点配置注意事项:

- 推荐设置是 `"moduleResolution": "node16"`(由 `"module": "node16"` 隐含)。这要求 TypeScript 4.7 或更高版本。
- 如果你使用 ESM,默认配置即可。
- 如果你把 TypeScript 编译为 CJS 且无法使用 `"moduleResolution": "node16"`,则必须启用 `esModuleInterop`。
- 如果你用 TypeScript 对 CJS JavaScript 代码做类型检查,唯一选择是 `"moduleResolution": "node16"`。

## axios 错误的类型守卫

使用 `axios.isAxiosError` 类型守卫可以在 `catch` 块中安全地收窄 `unknown` 错误。收窄之后,就能以完整的类型安全访问 `error.response`、`error.config`、`error.code` 等 axios 特有属性。

```ts
import axios from "axios";

let user: User | null = null;
try {
  const { data } = await axios.get("/user?ID=12345");
  user = data.userDetails;
} catch (error) {
  if (axios.isAxiosError(error)) {
    handleAxiosError(error);
  } else {
    handleUnexpectedError(error);
  }
}
```

使用 `axios.isCancel<T>()` 可以把取消错误收窄为 `CanceledError<T>`:

```ts
const controller = new AbortController();

try {
  await axios.get<User>("/user?ID=12345", { signal: controller.signal });
} catch (error) {
  if (axios.isCancel<User>(error)) {
    handleCancellation(error);
  }
}
```

## 为请求数据和查询参数标注类型

`AxiosRequestConfig<D = any, P = any>` 用 `D` 表示请求数据,用 `P` 表示查询参数。自定义 params 序列化器接收同样的 `P`:

```ts
import axios, {
  type AxiosPromise,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

interface RequestBody {
  includeArchived: boolean;
}

interface SearchParams {
  query: string;
  page?: number;
}

interface SearchResponse {
  results: string[];
}

const searchConfig: AxiosRequestConfig<RequestBody, SearchParams> = {
  data: { includeArchived: false },
  params: { query: "axios", page: 1 },
  paramsSerializer: (params) => `${params.query}:${params.page ?? 1}`,
};

const response = await axios.get("/search", searchConfig);
response.config.data;   // RequestBody | undefined
response.config.params; // SearchParams | undefined

const invalidConfig: AxiosRequestConfig<RequestBody, SearchParams> = {
  // @ts-expect-error `query` must be a string
  params: { query: 123 },
};
```

默认的请求结果会在 `response.config` 上保留 `D` 和 `P`,包括请求别名从带类型的请求配置推断这些类型的情况。`RawAxiosRequestConfig`、`InternalAxiosRequestConfig`、`AxiosDefaults`、`CreateAxiosDefaults`、`AxiosResponse`、`AxiosPromise`、`AxiosError`、`CanceledError`、可调用实例、适配器以及 `mergeConfig()` 同样携带查询参数类型。

请求方法把 `P` 作为最后一个泛型——`<T, R, D, P>`——因此现有的响应数据(`T`)、自定义响应(`R`)和请求数据(`D`)位置保持不变。显式提供的自定义响应类型仍然决定 resolve 出的值。为了向后兼容,`P` 默认为 `any`。

适配器或其他显式标注类型的 Promise 可以同时保留两种请求类型:

```ts
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

declare const error: unknown;

if (axios.isCancel<SearchResponse, RequestBody, SearchParams>(error)) {
  error.config?.data;   // RequestBody | undefined
  error.config?.params; // SearchParams | undefined
}
```

## 带类型的实例与拦截器

用 `AxiosInstance` 标注 `axios.create` 的结果,用 `InternalAxiosRequestConfig` 标注请求拦截器,即可为自定义客户端获得端到端的类型检查:

```ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const apiClient: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 10000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Add auth token, log, etc.
  return config;
});
```

## Symbol 键的自定义请求配置

axios 在合并默认配置与单次请求配置时会保留自身的可枚举 symbol 属性。应用可以通过模块扩充(module augmentation)为 `AxiosRequestConfig` 添加特定 symbol 键,并在拦截器或适配器中从 `InternalAxiosRequestConfig` 读取该选项:

```ts
import axios from "axios";

export const someFlag: unique symbol = Symbol(
  "some flag used in request interceptor"
);

declare module "axios" {
  interface AxiosRequestConfig<D = any, P = any> {
    [someFlag]?: boolean;
  }
}

axios.interceptors.request.use((config) => {
  if (config[someFlag]) {
    config.headers.set("X-Some-Flag", "enabled");
  }
  return config;
});

await axios.get("/users", { [someFlag]: true });
```

只有自身的可枚举 symbol 属性会被复制;不可枚举以及继承而来的 symbol 属性不会。

## 为响应数据标注类型

Axios 的请求方法对响应数据类型是泛型的。向 `axios.get<T>`(以及其他别名)传入类型参数即可为 `response.data` 标注类型:

```ts
interface User {
  id: number;
  name: string;
}

const { data } = await apiClient.get<User>("/users/1");
// `data` is typed as `User`
```
