> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。
>
> 注:原文超过 10000 字符,本译文覆盖核心章节(全部条目已译,技术表述与原文对齐)。

# 预发布文档说明(Pre-Release Documentation Notes)

## 目的

跟踪在发布准备阶段应落地的文档更新。

不要把本文件当作最终文档。每一条目都应提供足够上下文,让维护者或 LLM 能在发布准备时更新 README、docs 页面、示例、迁移指南和翻译文档。

不要在这里存放原始 diff 或仅含行号的指令;请使用稳定的章节名、目标文件、所需概念、示例和发布特定的备注。

## 条目格式

- **Change:** 功能/修复的简短名称。
- **Source:** PR、issue 或更新日志引用。
- **Status:** Pending | Applied | Skipped。
- **Docs targets:** 可能需要更新的文件或文档章节。
- **Required content:** 文档必须说明的内容。
- **Examples:** 应包含的代码片段或示例。
- **Notes:** 约束、仅限本发布的措辞、翻译跟进事项等。

## Unreleased(未发布)

### 运行时配置原型加固

- **Change:** 记录应用于请求配置与拦截器替换结果的共享原型过滤。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes,Runtime configuration hardening。
- **Status:** Pending。
- **Docs targets:** 请求拦截器与自定义适配器指南;request-config 的安全与迁移说明;英文文档定稿后的翻译文档。
- **Required content:** 说明自有(own)请求配置字段继续受支持,包括位于根 null-prototype 配置上的字段,但非安全的实例化键(`__proto__`、`constructor`、`prototype`)始终被排除。仅从某个 realm 的共享 `Object.prototype` 继承而来的值会被忽略,即使该原型的 `constructor` 被修改、删除或替换为访问器也一样。返回可写的、已合并的 null-prototype 配置的拦截器,会让该对象在适配器和 `response.config` 中保持同一性。被冻结、被密封、基于访问器、受其他限制或含非安全键的 null-prototype 替换对象,会被物化为可写的过滤快照,因为 dispatch 会更新 headers、data 和临时响应状态等字段,必须保持危险键过滤这一不变量。返回具有非终结(non-terminal)应用自定义原型的替换对象的拦截器,同样会被转换为 null-prototype 的规范化快照:安全的继承字段会被物化为自有字段,但原始同一性、原型、`instanceof` 标识、访问器位置和属性描述符属性不会被保留。由于外来共享 `Object.prototype` 在可变属性被改动后,与应用创建的终结 null-prototype 模板在结构上无法区分,终结 null-prototype 祖先上的继承字段被有意排除,作为"默认拒绝"(fail-closed)的安全边界。
- **Examples:** 展示一个未改动的已合并配置在请求拦截器与自定义适配器之间保持同一性。展示一个请求拦截器返回带非终结应用原型的对象,其自定义适配器字段被物化进规范化快照,并与终结的 `Object.create(null)` 原型对比——后者的继承行为字段会被忽略。
- **Notes:** 将替换对象的规范化与终结 null-prototype 限制表述为有意的安全兼容性变更。不要暗示修改 `Object.prototype` 是受支持或安全的行为。

### 代理绕过 CIDR 区段

- **Change:** 记录 `NO_PROXY` 和 `no_proxy` 中的 CIDR 匹配。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Features,Proxy bypass CIDR ranges。
- **Status:** Pending。
- **Docs targets:** Node 代理/环境变量指南与 request-config 的 proxy 文档;英文文档定稿后的翻译文档。
- **Required content:** 说明支持 IPv4 和 IPv6 的 CIDR 条目,接受带方括号的 IPv6,IPv4 映射的 IPv6 区段在前缀允许时规范化为 IPv4,地址族保持相互独立,格式错误的 CIDR 条目不会绕过代理。明确说明 `0.0.0.0/0` 会为所有 IPv4 目标绕过代理,`::/0` 对 IPv6 同理。
- **Examples:** 展示 `NO_PROXY=10.0.0.0/8,2001:db8::/32` 使匹配的 HTTP 目标绕过代理,并指出 `/0` 是覆盖整个地址族的形式。
- **Notes:** 保留既有的主机名、显式端口、通配符、回环以及非 CIDR 匹配行为。

### Fetch 与 HTTP/2 适配器选项一致性

- **Change:** 记录各适配器在重定向、自定义 fetch、DNS 查询和代理行为上的差异。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes,Fetch adapter consistency 与 HTTP/2 adapter consistency。
- **Status:** Pending。
- **Docs targets:** `fetchOptions`、`maxRedirects`、`lookup`、`httpVersion` 和 `proxy` 的 request-config 条目;自定义适配器/fetch 指南;英文文档定稿后的翻译文档。
- **Required content:** 说明在支持 `Request` 的环境中,自定义 fetch 会收到完全解析后的 `Request`,并继续收到第二个 `fetchOptions` 参数(只含安全的自有自定义字段);由 Axios 管理的字段(如 method、headers、body、signal、duplex、credentials)由 `Request` 表示,不再出现在第二个参数中。此前从第二个参数读取这些字段的自定义 fetch 实现必须迁移到 `Request`;这是一项有意的兼容性变更,防止第二个参数覆盖权威请求。说明在 Fetch 适配器中 `maxRedirects: 0` 表示手动处理重定向,但响应可见性遵循 Fetch 运行时:Node 可能暴露 3xx 状态码和 `Location`,而浏览器返回不透明的重定向(状态码 0、请求头不可访问)。自定义 DNS lookup 适用于 HTTP/2 连接并参与会话复用。HTTP/2 忽略进程环境变量与 HTTP/1 agent 的 `proxyEnv` 设置,因为 `http2.connect()` 无法应用它们;`proxy: false` 仍表示直连;显式的 Axios 代理对象会以 `ERR_NOT_SUPPORT` 拒绝。
- **Examples:** 给出重点的 Fetch `maxRedirects: 0` 示例,以及 Node `httpVersion: 2` 配合 `lookup` 的示例。
- **Notes:** 将过滤后的自定义 Fetch 第二参数、Fetch 手动重定向和显式 HTTP/2 代理拒绝表述为有意的兼容性变更。不要暗示正的 Fetch `maxRedirects` 值会强制执行重定向计数;只有 0 会映射到平台的手动重定向模式。不要把 Node 可见的 3xx 响应描述为可移植的浏览器行为。对把代理视为强制策略的部署,持续突出 HTTP/2 环境代理直连出口的残留风险。

### RFC 9110 HTTP 状态码名称

- **Change:** 记录 HTTP 状态 413 和 422 新增的 RFC 9110 名称。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Features,#11082,closes #11066。
- **Status:** Pending。
- **Docs targets:** `README.md` 与 `docs/pages/advanced/api-reference.md` 的 `HttpStatusCode` 说明;迁移或升级说明;英文文档定稿后的翻译文档。
- **Required content:** 引入 413 对应的 `HttpStatusCode.ContentTooLarge` 和 422 对应的 `HttpStatusCode.UnprocessableContent` 作为首选的 RFC 9110 名称。说明 `PayloadTooLarge` 与 `UnprocessableEntity` 作为已废弃别名在整个 v1.x 中仍然可用,数字反查为了向后兼容仍返回旧的遗留名称。
- **Examples:** 展示使用 `HttpStatusCode.ContentTooLarge` 与 `HttpStatusCode.UnprocessableContent` 的正向比较。
- **Notes:** 移除废弃别名或更改数字反查字符串保留给未来的主版本。保持 ESM 与 CommonJS 示例一致,并在英文措辞定稿后更新翻译文档。

### 从下载进度事件中流式读取

- **Change:** 记录如何从节流的下载进度事件中读取增量响应数据,以及 XHR 成功 `loadend` 时保证最终一次投递。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes,closes #6796。
- **Status:** Pending。
- **Docs targets:** README 中 `onDownloadProgress` 的请求配置参考;任何响应流式处理示例。
- **Required content:** 进度回调是节流的,因此中间投递可能发生在浏览器原始事件派发结束之后;此时按 DOM 语义 `event.currentTarget` 为 `null`,而 `event.target` 仍引用该请求。当已完成的 XHR 下载到达其成功的 `loadend` 处理器并实时派发时,保证有最后一次携带完整传输状态的下载投递。上传进度、流错误或中止原因的冲刷、以及失败的 XHR 下载,仍保持此前的 pending-event 行为。
- **Examples:** 一个增量 `responseText` 读取器,在 `onDownloadProgress` 内使用 `progressEvent.event.target` 切分新数据。

### 带类型的请求参数(Typed request params)

- **Change:** 记录 axios 公开 TypeScript 声明中新增的请求参数泛型。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Features,#11081,closes #4954。
- **Status:** Applied。
- **Docs targets:** TypeScript 使用指南;`params` 与 `paramsSerializer` 的请求配置参考;请求方法、`AxiosResponse`、`AxiosPromise`、`AxiosError`、`CanceledError`、`isCancel` 和适配器的 API 参考;取消请求指南;英文文档定稿后的翻译文档。
- **Required content:** 说明 `AxiosRequestConfig<D = any, P = any>` 用 `D` 表示请求数据、`P` 表示查询参数,自定义 params 序列化器接收同样的 `P`。覆盖其在 `RawAxiosRequestConfig`、`InternalAxiosRequestConfig`、defaults、默认响应形状、`AxiosResponse`、`AxiosPromise<T, D, P>`、`AxiosError`、`CanceledError`、`isCancel<T, D, P>` 类型守卫、请求别名、`request()`、可调用实例、适配器和 `mergeConfig()` 中的传播。说明默认请求结果和显式类型的 `AxiosPromise` 值会在 `response.config.data` 与 `response.config.params` 上保留 `D` 与 `P`,包括请求方法从请求配置推断这些类型的情况。指出请求方法把 `P` 加为最后一个泛型,因此现有的 `T`、自定义响应 `R` 和 `D` 位置保持不变,且显式提供的自定义响应类型继续决定 resolve 的值。
- **Examples:** 展示 `SearchParams` 接口配合 `AxiosRequestConfig<RequestBody, SearchParams>` 使用,包括接收 `SearchParams` 的序列化器回调、一个被 TypeScript 拒绝的非法 params 对象,以及 `response.config.params` 仍为 `SearchParams` 的推断默认响应。给出 `AxiosPromise<ResponseBody, RequestBody, SearchParams>` 的适配器/Promise 示例,以及用 `isCancel<ResponseBody, RequestBody, SearchParams>()` 从 `unknown` 收窄取消错误,演示两者都会在 config 上保留请求数据与参数类型。
- **Notes:** README、英文文档和西班牙语、法语、中文翻译已覆盖请求数据与参数泛型、序列化器类型、默认响应传播、Promise/适配器、错误与取消收窄、请求方法顺序和配置合并。为向后兼容记录了 `any` 默认值;内部的默认响应标记不写入文档。

### 同步请求拦截器错误处理

- **Change:** 记录同步请求拦截器抛错时的处理方式,不改变既有的配对处理器契约。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes,#11071。
- **Status:** Applied。
- **Docs targets:** `README.md` Interceptors 章节;拦截器 API 参考;迁移/升级说明;英文文档定稿后的翻译文档。
- **Required content:** 说明当同步请求拦截器抛出异常时,axios 会调用该拦截器配对的 `onRejected` 处理器,并停止执行其余的请求拦截器。如果该处理器正常返回(包括返回 `undefined` 或已 fulfilled 的 Promise),axios 会视错误为已处理,并以最后一个有效配置发起请求;处理器返回的值不会替换该配置。如果没有 rejection 处理器,或处理器抛出异常或返回被拒绝的 Promise,axios 不会发起请求。终结性错误会继续经过响应 rejection 拦截器。
- **Examples:** 展示一个同步校验拦截器,其 rejection 处理器返回 `Promise.reject(error)` 以阻止请求发起;以及一个仅做日志的 rejection 处理器,通过正常返回保持既有的请求继续执行行为。
- **Notes:** README、拦截器文档、升级指南和西班牙语、法语、中文翻译现在都包含阻止与继续两类示例,同时保持 axios 同步配对处理器语义。

### 可选启用的 AxiosHeaders 参数解析

- **Change:** 记录新增的 `AxiosHeaders.parseParameters()` 解析器,用于规范化的 HTTP 参数值。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Features,#11051,closes #11050。
- **Status:** Applied。
- **Docs targets:** `README.md` 的 `AxiosHeaders#get` 章节;`docs/pages/advanced/api-reference.md` 与 `docs/pages/advanced/header-methods.md`;英文文档定稿后的翻译文档。
- **Required content:** 说明调用者可以向 `AxiosHeaders#get()` 传入 `AxiosHeaders.parseParameters`,得到一个参数名不区分大小写的 null-prototype 映射,并移除引号字符串定界符、解码 quoted-pair 的 DQUOTE/反斜杠转义、保留引号值内的逗号和分号、仅去除未加引号值两侧的 RFC 可选空白。注意非安全的对象实例化键(`__proto__`、`constructor`、`prototype`)会被忽略。明确说明 `get(name, true)` 仍是遗留分词器,为向后兼容保持既有输出。
- **Examples:** 展示对 `multipart/form-data; boundary="a,b"` 调用 `headers.get('content-type', AxiosHeaders.parseParameters)` 返回 `{ boundary: 'a,b' }`。
- **Notes:** README、API/header-method 文档和西班牙语、法语、中文翻译已记录该新增解析器、其加固输出、引号值行为以及保持不变的遗留 `true` 分词器。

### 拒绝畸形的 `http(s):` URL

- **Change:** 记录 axios 拒绝协议后缺少 `//` 的 `http:`/`https:` URL,且错误信息现在会指出问题 URL。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes,#11000(拒绝行为)与 #11008(改进消息)。
- **Status:** Applied。
- **Docs targets:** `README.md` errors / handling-errors 章节;迁移/升级说明;`docs/pages/advanced/request-config.md` 的 `url`/`baseURL` 描述;英文文档定稿后的翻译文档。
- **Required content:** 说明自本发布起,形如 `https:example.com` 或 `https:/example.com`(有 scheme、缺 `//`)的请求 `url` 或 `baseURL` 会以代码为 `ERR_INVALID_URL` 的 `AxiosError` 被拒绝,而不再被浏览器/Node 的 URL 解析器静默规范化。这是一项防止 `baseURL`/白名单(SSRF)绕过的安全修复。调用方必须传入格式良好的 URL,如 `https://example.com`。错误信息现在包含问题 URL:`Invalid URL "https:example.com": missing "//" after protocol`。报告中的 URL 是控制字符规范化后的形式,并脱敏 userinfo(凭据)、查询参数值和 fragment 内容(参数名、主机与路径保留),因为 `AxiosError.message` 总是会被 `toJSON()` 序列化,而可选启用的 `config.redact` 机制无法清理它。
- **Examples:** 无需示例。
- **Notes:** README、request-config、error-handling、升级指南和西班牙语、法语、中文翻译已把该拒绝行为表述为有意的安全行为变更,并描述了安全脱敏的错误消息。

### Symbol 键的自定义请求配置

- **Change:** 记录自定义请求配置字段可以使用自身的可枚举 symbol 键,并在 axios 配置合并后保留。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes,#11043,closes #11042。
- **Status:** Applied。
- **Docs targets:** TypeScript/自定义客户端文档;request-config 参考;若拦截器文档中有自定义配置字段,则一并提供示例;英文文档定稿后的翻译文档。
- **Required content:** 说明应用可以通过模块扩充(module augmentation)为 `AxiosRequestConfig` 添加特定 symbol 键,并在请求配置中传入该 symbol 键的选项;axios 在合并 defaults 与请求配置时会保留该自身的可枚举 symbol 属性,使请求拦截器和适配器可以从 `InternalAxiosRequestConfig` 读取它。
- **Examples:** 给出简短的 TypeScript 示例:`export const someFlag = Symbol('some flag used in request interceptor')`、`declare module 'axios' { interface AxiosRequestConfig { [someFlag]?: boolean } }`,以及在请求拦截器中读取 `config[someFlag]`。
- **Notes:** README、TypeScript/request-config 文档和西班牙语、法语、中文翻译已展示模块扩充与拦截器示例,并明确限定于自身的可枚举 symbol 属性。

### FormData 字面键解析

- **Change:** 记录 `formToJSON`/`formDataToJSON` 只按点号记法和方括号记法拆分 FormData 字段名。
- **Source:** `PRE_RELEASE_CHANGELOG.md` Bug Fixes,#11006,closes #5402。
- **Status:** Applied。
- **Docs targets:** `README.md` 的 FormData 序列化器/formToJSON 章节;`docs/pages/advanced/api-reference.md` 的 `formToJSON`;multipart/urlencoded 表单序列化的生成文档页;英文文档定稿后的翻译文档。
- **Required content:** 说明把 FormData 转回 JSON 时,`.`、`[`、`]` 是结构化的路径分隔符,而其他字符(如 `-`、空格、`+`、`*`、`&`)保留为字面键字符。提及 `foo[bar]`、`foo.bar` 和 `foo[]` 仍会创建嵌套对象/数组路径。
- **Examples:** 给出简短示例:`form.append('user-name', 'johndoe')` 转换为 `{ 'user-name': 'johndoe' }`;`form.append('user.name', 'john')` 或 `form.append('user[name]', 'john')` 转换为 `{ user: { name: 'john' } }`。
- **Notes:** README、API/multipart/HTML-form 文档和西班牙语、法语、中文翻译已记录点号/方括号路径解析和字面标点键,不再把旧的拆分行为描述为受支持。
