> 🌐 本文档由 [axios/axios](https://github.com/axios/axios) 翻译,英文原版见原项目。

# 贡献指南

我们接受社区贡献。向 axios 贡献代码,即表示你同意遵守[行为准则](https://github.com/axios/axios/blob/master/CODE_OF_CONDUCT.md)。

## 代码风格

请遵循 [node 风格指南](https://github.com/felixge/node-style-guide)。

## 提交信息

请遵循[约定式提交(conventional commits)](https://www.conventionalcommits.org/en/v1.0.0/)。

## 测试

请为你的改动更新相应测试。Pull request 必须通过 GitHub Actions。

## 文档

API 发生变化时,请同步更新[文档](https://axios-http.com/docs/intro),保证 API 与文档一致。

## 依赖与 GitHub Actions 更新

请不要提交只更新 npm 包、lockfile 或 GitHub Actions 版本的 pull request。来自外部贡献者的此类 PR 会被直接关闭。只有维护者和经批准的自动化机器人才能创建依赖包及 GitHub Actions 更新类 PR。

除非出现需要维护者手动更新的严重漏洞,我们会对这些更新保留 7 天的 Dependabot 延迟。

## 开发

- `npm run test` 运行 Jasmine 和 Mocha 测试
- `npm run build` 运行 Rollup 打包源码
- `npm run version` 为发布准备代码

## 运行示例

可使用示例进行手动测试。

运行示例:

```bash
> npm run examples
# 打开 127.0.0.1:3000
```

运行浏览器沙箱:

```bash
> npm start
# 打开 127.0.0.1:3000
```

运行终端沙箱:

```bash
> npm start
> node ./sandbox/client
```
