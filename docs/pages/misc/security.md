> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。
>
> 注:原文超过 10000 字符,本译文覆盖核心章节;文末"披露政策/60 天承诺"等流程性内容与根目录 [SECURITY.md](../../../SECURITY.md) 一致,细节请参见该文件。

# 安全策略

## ⚠️ 解压炸弹 / 无上限的响应缓冲

默认情况下,`maxContentLength` 和 `maxBodyLength` 的值为 `-1`(不限制)。恶意或被攻陷的服务器可以返回一个体积很小的 gzip/deflate/brotli/zstd 压缩响应体,解压后却膨胀到数 GB,耗尽 Node.js 进程的内存。

**如果你要请求不完全可信的服务器,必须为你的业务负载设置合适的 `maxContentLength`(以及 `maxBodyLength`)。** 该限制在流式解压过程中逐块生效,因此设置它就足以化解解压炸弹攻击。

```js
axios.get('https://example.com/data', {
  maxContentLength: 10 * 1024 * 1024, // 10 MB
  maxBodyLength: 10 * 1024 * 1024,
});

// 或者全局设置:
axios.defaults.maxContentLength = 10 * 1024 * 1024;
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

默认值之所以没有收紧,是因为那样做会悄无声息地破坏所有超过所选上限的合法下载。为不可信来源选择安全上限,责任在应用程序自身。

## 其他安全敏感配置项

以下请求配置项直接影响安全性。它们在[请求配置](/pages/advanced/request-config)文档中有完整说明,这里集中汇总,便于统一查阅。

| 配置项 | 风险 | 缓解措施 |
| --- | --- | --- |
| [`baseURL`](/pages/advanced/request-config#baseurl) | 应用有时会把 `baseURL` 路径前缀(如 `https://api.example.com/v1/`)当作请求边界。用户可控的相对 `url` 值可以包含 `..` 段,最终 URL 解析器会将其规范化,从而落到该路径前缀之外。 | 不要依赖 `baseURL` 做路径隔离。在把不可信请求路径交给 axios 之前先校验:拒绝绝对 URL、协议相对 URL 和 `..` 段,或者对照白名单检查最终 URL 的 origin 和 pathname。 |
| [`socketPath`](/pages/advanced/request-config#socketpath) | 如果它来自不可信输入,攻击者可以把流量重定向到 `/var/run/docker.sock` 这类高权限本地套接字,绕过基于主机名的 SSRF 防护(CWE-918)。 | 从不可信输入中剔除或对配置键做白名单过滤。使用 [`allowedSocketPaths`](/pages/advanced/request-config#allowedsocketpaths) 限制可接受的套接字路径。 |
| [`beforeRedirect`](/pages/advanced/request-config#beforeredirect) | 该回调运行于 `follow-redirects` 在协议降级时剥离凭据之后。不检查目标协议就重新注入凭据,可能把凭据泄露到明文 HTTP 上。 | 只对可信的 HTTPS 目标重新添加凭据。在赋值 `auth` 之前检查 `options.protocol === "https:"`。 |
| [`sensitiveHeaders`](/pages/advanced/request-config#sensitiveheaders) | 像 `X-API-Key` 这类自定义密钥请求头,在 Node.js HTTP 适配器跟随重定向到不同源时可能被转发出去。 | 在 `sensitiveHeaders` 中列出携带机密的自定义请求头名称;axios 会在跨源重定向时不区分大小写地移除匹配的请求头。同源重定向会保留它们。 |
| [`withXSRFToken`](/pages/advanced/request-config#withxsrf-token) | 设为 `true` 会强制在跨源请求上携带 XSRF 请求头。旧版 axios 在 `withCredentials: true` 时隐式启用该行为;新版本要求两个开关同时打开。 | 保持 `undefined`(仅同源)除非你的后端明确校验跨源请求的 XSRF。 |
| [`redact`](/pages/advanced/request-config#redact) | `AxiosError#toJSON()` 默认包含请求配置,可能把 `Authorization` 请求头或 `auth` 凭据泄入错误日志和遥测数据。 | 传入包含敏感配置键名的 `redact` 数组。匹配不区分大小写并递归生效。 |
| [`formDataHeaderPolicy`](/pages/advanced/request-config#formdataheaderpolicy) | 自定义 `FormData` 的 `getHeaders()` 若返回攻击者可控的值,可能在 Node.js 中覆盖 `Authorization` 等请求头或注入任意请求头。 | 设置 `'content-only'`,只复制 `Content-Type` 和 `Content-Length`,其余请求头通过请求的 `headers` 配置显式设置。 |

## 供应链加固:`ignore-scripts` 与生命周期脚本

本仓库带有项目级 `.npmrc`,设置了 `ignore-scripts=true`。在仓库内执行 `npm install` 或 `npm ci` 时,这会阻止任何直接或传递依赖运行 npm 生命周期脚本(`preinstall`、`install`、`postinstall`、`prepare`)。理由见 [THREATMODEL.md](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md)(威胁 T-S2)。

一个后果是:仓库自身的 `prepare` 钩子(用于安装 Husky 的 git 钩子)**不会**自动运行。首次安装后请手动启用 git 钩子:

```bash
npm ci
npm rebuild husky && npx husky
```

每次全新 checkout 后运行一次这两条命令即可,后续 `npm install` **不需要**重复执行。

::: danger 不要移除 `ignore-scripts=true`
为了"修好" husky 而从 `.npmrc` 中移除 `ignore-scripts=true`,会为依赖树中的所有其他包重新打开生命周期脚本攻击面。所有 CI 工作流已经以 `--ignore-scripts` 调用 npm,因此本地行为与 CI 一致。
:::

我们建议任何把 axios(或其他依赖)引入处理机密信息的构建环境的项目,都采用同样的 `ignore-scripts=true` 设置。

## 验证发布版本

npm 上的每个 `axios` 压缩包都通过 GitHub Actions 发布,并附带 [npm 出处证明(provenance attestation)](https://docs.npmjs.com/generating-provenance-statements),以加密方式将包与生成它的工作流及 commit SHA 绑定。

使用者可以在本地验证出处:

```bash
# 验证 lockfile 中的所有包,包括 axios
npm audit signatures
```

验证成功说明该压缩包是在 `axios/axios` 的 GitHub Actions 环境中、于某个已知 commit 上构建的——从构建到进入 registry 期间未被篡改。但它**不能**证明该 commit 中的代码没有 bug。

如果 `npm audit signatures` 对某个近期 `axios` 版本报出证明缺失或无效,应将其视为潜在的供应链安全事件,并通过下方的私密渠道报告。

## 报告漏洞

如果你认为发现了本项目的安全漏洞,请按以下流程报告。我们严肃对待所有安全漏洞。如果漏洞位于第三方库中,请向该库的维护者报告。

## 报告流程

请勿通过公开的 GitHub issue 报告安全漏洞。请使用 GitHub 官方安全渠道,发起一个[安全通告(security advisory)](https://github.com/axios/axios/security/advisories/new)。

## 披露政策

收到安全漏洞报告后,我们会指定一名主要负责人。该负责人负责确认问题、确定受影响版本、评估严重程度、开发并发布修复,以及与报告者协调公开披露。

### 60 天解决与披露承诺

我们承诺:**对每一个有效的安全通告,在初始报告后 60 个自然日内完成解决并公开披露**,时限从通过 [GitHub 安全通告渠道](https://github.com/axios/axios/security/advisories/new)收到报告的时刻起算。

60 天期限是对报告者和下游使用者的承诺——是兜底底线而非理想目标。如果我们无法按时发布修复,仍会在第 60 天发布通告及当时可用的最佳缓解措施指引,让使用者能够采取行动。

60 天窗口内的关键节点、例外与延期情形、报告者须知,详见根目录 [SECURITY.md](../../../SECURITY.md),此处不再重复。

## 安全更新

补丁开发并测试完成后,我们会尽快发布安全更新。通过项目 GitHub 仓库通知用户,在 GitHub Releases 页面发布发行说明与安全通告,并弃用所有包含该漏洞的版本。

## 维护者侧事件响应

对于影响维护者账号、工作站或发布基础设施的入侵场景(钓鱼、硬件密钥被盗、意外的 tag/发布),项目在 [THREATMODEL.md §3.7](https://github.com/axios/axios/blob/v1.x/THREATMODEL.md#37-incident-response-runbook) 中维护了一份内部事件响应手册,涵盖会话吊销、密钥轮换、下游通知以及取消发布/弃用流程。

## 安全合作伙伴与致谢

感谢以下与我们协作、帮助项目对所有人保持安全的研究人员:

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
