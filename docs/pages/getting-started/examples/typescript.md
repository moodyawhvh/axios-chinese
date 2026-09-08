> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# TypeScript 示例

## 引入类型

axios 开箱即附带 TypeScript 类型定义。你可以直接从 `"axios"` 引入所需的类型:

```ts
import axios from "axios";
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
```

## 为请求标注类型

通过响应上的泛型类型参数,告诉 TypeScript 你的数据是什么形状:

```ts
import axios from "axios";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const response = await axios.get<Post>("https://jsonplaceholder.typicode.com/posts/1");

console.log(response.data.title); // TypeScript 知道这是 string 类型
```

## 为函数标注类型

将请求封装进带显式返回类型的函数,获得最强的类型安全:

```ts
import axios, { AxiosResponse } from "axios";

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const getPost = async (id: number): Promise<Post> => {
  const response = await axios.get<Post>(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  return response.data;
};
```

## 为 POST 请求标注类型

可以同时为请求体和预期响应标注类型:

```ts
type CreatePostBody = {
  title: string;
  body: string;
  userId: number;
};

type CreatePostResponse = CreatePostBody & { id: number };

const createPost = async (data: CreatePostBody): Promise<CreatePostResponse> => {
  const response = await axios.post<CreatePostResponse>(
    "https://jsonplaceholder.typicode.com/posts",
    data
  );
  return response.data;
};
```

## 带类型的 axios 实例

创建一个带类型的实例,把 baseURL 和请求头固化进去:

```ts
import axios from "axios";
import type { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 5000,
});
```

## 带类型的拦截器

在 v1.x 中,请求拦截器要使用 `InternalAxiosRequestConfig`(而不是 `AxiosRequestConfig`):

```ts
import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.set("Authorization", `Bearer ${getToken()}`);
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => Promise.reject(error)
);
```

## 为错误标注类型

使用 `axios.isAxiosError()` 收窄捕获到的错误的类型:

```ts
import axios, { AxiosError } from "axios";

type ApiError = {
  message: string;
  code: number;
};

try {
  await axios.get("/api/protected-resource");
} catch (error) {
  if (axios.isAxiosError<ApiError>(error)) {
    // error.response?.data 会被推断为 ApiError 类型
    console.error(error.response?.data.message);
    console.error(error.response?.status);
  } else {
    throw error;
  }
}
```

## TypeScript 配置注意事项

axios 同时发布 ESM 和 CJS 两种格式,不同配置下有几点需要注意:

- 推荐设置 `"moduleResolution": "node16"`(`"module": "node16"` 会隐含它)。这要求 TypeScript 4.7 或更高版本。
- 如果你把 TypeScript 编译为 CJS 且无法使用 `"moduleResolution": "node16"`,请启用 `"esModuleInterop": true`。
- 如果你用 TypeScript 对 CJS JavaScript 代码做类型检查,唯一的选择是 `"moduleResolution": "node16"`。
