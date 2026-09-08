> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 错误处理(Error handling)

axios 可能抛出多种不同类型的错误。有些由 axios 自身引起,有些则由服务器或客户端引起。下表列出了抛出错误的通用结构:

| 属性 | 定义 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| message  | 错误信息的快速摘要,以及失败时的状态码。 |
| name     | 定义错误的来源。对 axios 来说,它始终是 `AxiosError`。 |
| stack    | 错误的堆栈跟踪。 |
| config   | 发起请求时由用户定义的、包含具体实例配置的 axios 配置对象。 |
| code     | 表示一个 axios 已识别的错误。下表列出了 axios 内部错误的具体定义。 |
| status   | HTTP 响应状态码。常见 HTTP 状态码含义见[这里](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)。 |

以下是 axios 已识别错误的列表:

| 代码 | 定义 |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| ERR_BAD_OPTION_VALUE      | axios 配置中提供了无效或不支持的值。 |
| ERR_BAD_OPTION            | axios 配置中提供了无效选项。 |
| ECONNABORTED              | 通常表示请求已超时(除非设置了 `transitional.clarifyTimeoutError`)或被浏览器及其插件中止。 |
| ETIMEDOUT                 | 请求超过 axios 默认时限而超时。必须把 `transitional.clarifyTimeoutError` 设为 `true`,否则将抛出通用的 `ECONNABORTED` 错误。 |
| ERR_NETWORK               | 网络相关问题。在浏览器中,该错误也可能由 [CORS](https://developer.mozilla.org/ru/docs/Web/HTTP/Guides/CORS) 或[混合内容(Mixed Content)](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content) 策略违规引起。出于安全原因,浏览器不允许 JS 代码探知此类错误的真实原因,请查看控制台。 |
| ERR_FR_TOO_MANY_REDIRECTS | 请求重定向次数过多;超过了 axios 配置中指定的最大重定向次数。 |
| ERR_DEPRECATED            | 使用了 axios 中已废弃的功能或方法。 |
| ERR_BAD_RESPONSE          | 响应无法正确解析或格式不符合预期。通常与 `5xx` 状态码的响应有关。 |
| ERR_BAD_REQUEST           | 请求格式不符合预期或缺少必需参数。通常与 `4xx` 状态码的响应有关。 |
| ERR_CANCELED              | 功能或方法被用户通过 AbortSignal(或 CancelToken)显式取消。 |
| ERR_NOT_SUPPORT           | 当前 axios 环境不支持该功能或方法。 |
| ERR_INVALID_URL           | 为 axios 请求提供了无效的 URL。 |
| ERR_FORM_DATA_DEPTH_EXCEEDED | 序列化 `params` 或表单数据时,对象超过了配置的 `maxDepth`。默认限制为 100 层。参见 [`paramsSerializer`](/pages/advanced/request-config#paramsserializer) 与 [`formSerializer`](/pages/advanced/request-config#formserializer)。 |

## 处理错误

axios 的默认行为是请求失败时 reject Promise。不过你也可以捕获错误并按自己的方式处理。下面是一个捕获错误的示例:

```js
axios.get("/user/12345").catch(function (error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    console.log(error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error.message);
  }
  console.log(error.config);
});
```

## 畸形的 HTTP(S) URL

如果 `http:` 或 `https:` 的请求 `url` 或 `baseURL` 在协议后省略了 `//`,axios 会将其 reject。例如 `https:example.com` 和 `https:/example.com` 会以代码为 `ERR_INVALID_URL` 的 `AxiosError` 被拒绝,而不是被浏览器或 Node.js 的 URL 解析器静默规范化。请使用格式良好的 URL,如 `https://example.com`。

错误信息会指出问题 URL,例如:

```text
Invalid URL "https:example.com": missing "//" after protocol
```

这一行为可防止畸形 URL 绕过 `baseURL` 或 URL 白名单。报错中的 URL 会做控制字符规范化,并脱敏凭据、查询参数值和 fragment 内容;同时保留 scheme、主机、路径和查询参数名,使请求仍可识别。消息级脱敏是无条件的,因为 `AxiosError.message` 总是会被 `toJSON()` 包含,请求配置的 `redact` 选项无法清理已经生成的消息。

通过 `validateStatus` 配置项,你可以覆盖默认条件(status >= 200 && status < 300),自定义哪些 HTTP 状态码应当抛出错误:

```js
axios.get("/user/12345", {
  validateStatus: function (status) {
    return status < 500; // Resolve only if the status code is less than 500
  },
});
```

使用 `toJSON` 方法,可以得到一个包含更多错误信息的对象:

```js
axios.get("/user/12345").catch(function (error) {
  console.log(error.toJSON());
});
```

为避免把 `error.config` 中的机密信息写进日志,可以在请求配置中传入 `redact` 数组。调用 `AxiosError#toJSON()` 时,匹配的配置键会在任意深度不区分大小写地被掩码。

```js
axios.get("/user/12345", {
  headers: { Authorization: "Bearer token" },
  redact: ["authorization"]
}).catch(function (error) {
  console.log(error.toJSON().config.headers.Authorization); // [REDACTED ****]
});
```

## 处理超时

当请求超过配置的 `timeout` 时,axios 默认以 `ECONNABORTED` reject。设置 `transitional.clarifyTimeoutError: true` 可以改为收到 `ETIMEDOUT`,使超时错误更容易与其他中止情况区分。

```js
async function fetchWithTimeout() {
  try {
    const response = await axios.get("https://example.com/data", {
      timeout: 5000, // 5 seconds
      transitional: {
        // set to true if you prefer ETIMEDOUT over ECONNABORTED
        clarifyTimeoutError: true,
      },
    });

    console.log("Response:", response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        console.error("Request timed out. Please try again.");
        return;
      }

      console.error("Axios error:", error.message);
      return;
    }

    console.error("Unexpected error:", error);
  }
}
```

::: tip 生产环境务必设置 `timeout`
不设置的话,一个停滞的请求可能无限期挂起。参见 [`timeout`](/pages/advanced/request-config#timeout) 和 [`transitional.clarifyTimeoutError`](/pages/advanced/request-config#transitional) 配置项。
:::
