<div align="center">

# axios 中文翻译版

**[中文版] axios — 基于 Promise 的浏览器与 Node.js HTTP 客户端**

[![原项目](https://img.shields.io/badge/原项目-axios--axios-blue?style=flat-square&logo=github)](https://github.com/axios/axios)
[![中文文档](https://img.shields.io/badge/中文文档-README.zh--CN.md-orange?style=flat-square)](README.zh-CN.md)
[![GitHub Stars](https://img.shields.io/github/stars/axios/axios?style=flat-square&label=原项目Stars)](https://github.com/axios/axios/stargazers)
[![微信联系](https://img.shields.io/badge/微信-uaycar-brightgreen?style=flat-square&logo=wechat)](#)

</div>

---

> 这是 [axios/axios](https://github.com/axios/axios) 的中文翻译版本。
> 完整源代码请访问原项目:https://github.com/axios/axios

**代部署 / 定制服务 / 技术咨询 请添加微信:uaycar**

---

## 📖 项目简介

axios 是前端生态中使用最广泛的 HTTP 请求库之一,基于 Promise API,同时支持浏览器(XMLHttpRequest)与 Node.js(http)环境。它提供拦截器、自动 JSON 序列化、请求取消、XSRF 防护、文件上传下载进度跟踪等能力,是现代前端网络请求的事实标准。本仓库是 axios 官方 README 的中文翻译版本,方便中文开发者快速上手与查阅。

## ✨ 主要特性

- 浏览器中发送 XMLHttpRequest,Node.js 中发送 http 请求
- 完整基于 Promise API,天然支持 async/await
- 请求/响应拦截器,可插入自定义逻辑或数据转换
- 自动序列化与解析 JSON 数据
- 数据对象可自动序列化为 `multipart/form-data` 或 `application/x-www-form-urlencoded`
- 内置请求取消能力(AbortController)
- 客户端防御 CSRF(XSRF)攻击
- 支持 HTTP/2 与 Fetch adapter
- 内置完整 TypeScript 类型定义
- 支持上传/下载进度回调(onUploadProgress / onDownloadProgress)

## 📁 文件说明

| 文件 | 说明 |
|:-----|:-----|
| README.md | 本文件(中文简介) |
| README.zh-CN.md | 详细中文文档(完整汉化) |

## 🚀 快速开始

1. 用包管理器安装:

```bash
$ npm install axios
```

2. 在代码中导入:

```js
import axios from 'axios';
```

3. 发送 GET 请求:

```js
const response = await axios.get('/user', {
  params: { ID: 12345 },
  timeout: 5000,
});
console.log(response.data);
```

4. 发送 POST 请求:

```js
const response = await axios.post('/user', {
  firstName: 'Fred',
  lastName: 'Flintstone',
});
```

5. 创建带自定义配置的实例:

```js
const instance = axios.create({
  baseURL: 'https://some-domain.com/api/',
  timeout: 1000,
});
```

完整源代码与最新版本请访问原项目:https://github.com/axios/axios

## 📞 联系方式

**代部署 / 定制服务 / 技术咨询 请添加微信:uaycar**

---

本项目为 [axios/axios](https://github.com/axios/axios) 的中文翻译版本,所有代码版权归原项目作者所有,遵循其原始许可证。

**如果觉得有用,请给原项目点个 Star!** ⭐
