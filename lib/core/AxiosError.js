'use strict';

import utils from '../utils.js';
import AxiosHeaders from './AxiosHeaders.js';

// 【中文注释】脱敏占位符:序列化错误时,命中 redact 名单的敏感值会被替换为该字符串
export const REDACTED = '[REDACTED ****]';

// 【中文注释】判断对象自身或其原型链上是否存在 toJSON 方法
// 用于决定非普通对象(如 Date、自定义类实例)是否可直接原样保留
function hasOwnOrPrototypeToJSON(source) {
  if (utils.hasOwnProp(source, 'toJSON')) {
    return true;
  }

  let prototype = Object.getPrototypeOf(source);

  while (prototype && prototype !== Object.prototype) {
    if (utils.hasOwnProp(prototype, 'toJSON')) {
      return true;
    }

    prototype = Object.getPrototypeOf(prototype);
  }

  return false;
}

 // 生成 `config` 的纯对象快照,并把 redactKeys 名单中的键值
 // (不区分大小写)替换为 REDACTED。会递归处理数组和 AxiosHeaders,
 // 遇到循环引用时短路返回。
function redactConfig(config, redactKeys) {
  // 统一转小写,实现大小写不敏感的键名匹配
  const lowerKeys = new Set(redactKeys.map((k) => String(k).toLowerCase()));
  // seen 记录访问过的对象引用,用于发现并切断循环引用
  const seen = [];

  const visit = (source) => {
    // 基本类型直接返回;Buffer 原样保留(避免被转成无意义的结构)
    if (source === null || typeof source !== 'object') return source;
    if (utils.isBuffer(source)) return source;
    // 循环引用:该引用已在处理链上,返回 undefined 即从结果中剔除
    if (seen.indexOf(source) !== -1) return undefined;

    // AxiosHeaders 实例先转成普通对象再继续遍历
    if (source instanceof AxiosHeaders) {
      source = source.toJSON();
    }

    seen.push(source);

    let result;
    if (utils.isArray(source)) {
      // 数组:逐元素递归,丢弃 undefined 项
      result = [];
      source.forEach((v, i) => {
        const reducedValue = visit(v);
        if (!utils.isUndefined(reducedValue)) {
          result[i] = reducedValue;
        }
      });
    } else {
      // 非普通对象但带 toJSON(如 Date):整体原样保留
      if (!utils.isPlainObject(source) && hasOwnOrPrototypeToJSON(source)) {
        seen.pop();
        return source;
      }

      // 普通对象:逐键递归;键名命中 redact 名单则替换为脱敏占位符
      result = Object.create(null);
      for (const [key, value] of Object.entries(source)) {
        const reducedValue = lowerKeys.has(key.toLowerCase()) ? REDACTED : visit(value);
        if (!utils.isUndefined(reducedValue)) {
          result[key] = reducedValue;
        }
      }
    }

    seen.pop();
    return result;
  };

  return visit(config);
}

// 【中文注释】安全字符串化:转换失败(如 Symbol、循环结构)时返回空串而不是抛错
function stringifySafely(value) {
  try {
    return String(value);
  } catch (err) {
    return '';
  }
}

// 【中文注释】拼接 AggregateError 的聚合错误信息,作为外层 message 的兜底
function aggregateErrorMessage(error) {
  const message = error.errors
    .map((entry) => {
      try {
        return entry && entry.message ? stringifySafely(entry.message) : stringifySafely(entry);
      } catch (err) {
        return '';
      }
    })
    .filter(Boolean)
    .join('; ');

  return message || error.name || 'AggregateError';
}

// 【中文注释】AxiosError:axios 统一的错误类型,携带错误码、请求配置、请求与响应对象
class AxiosError extends Error {
  // 把第三方/原生错误包装成 AxiosError 的静态工厂
  static from(error, code, config, request, response, customProps) {
    // `AggregateError`(Node 在双栈/Happy-Eyeballs 连接失败时抛出)的
    // `message` 为空,细节在 `errors[]` 里。不补齐的话,包装出来的
    // 错误 message 是空白的(见 #6721)。
    let message = error.message;
    if (!message && utils.isArray(error.errors) && error.errors.length) {
      message = aggregateErrorMessage(error);
    }

    const axiosError = new AxiosError(message, code || error.code, config, request, response);
    // 对齐原生 `Error` 的 `cause` 语义:不可枚举。被包装的错误往往携带
    // 循环引用的内部对象(socket、request、agent),可枚举的 `cause` 会让
    // 结构化日志库(pino/winston)以及任何自有属性遍历抛出
    // "Converting circular structure to JSON"。
    // #6982 的回归问题;见 #7205。`__proto__: null` 与下方的
    // `message` 描述符一致(防原型污染的描述符写法)。
    Object.defineProperty(axiosError, 'cause', {
      __proto__: null,
      value: error,
      writable: true,
      enumerable: false,
      configurable: true,
    });
    // 保留原始错误的 name(便于识别错误来源)
    axiosError.name = error.name;

    // 响应未带 status 时,保留原始错误上的 status
    if (error.status != null && axiosError.status == null) {
      axiosError.status = error.status;
    }

    // 合并调用方附加的自定义属性
    customProps && Object.assign(axiosError, customProps);
    return axiosError;
  }

  /**
   * 用指定的 message、config、错误码、request 和 response 创建 Error。
   * 【中文注释】构造函数:有 response 时同步记录 status,方便调用方直接读取。
   *
   * @param {string} message 错误信息。
   * @param {string} [code] 错误码(例如 'ECONNABORTED')。
   * @param {Object} [config] 请求配置。
   * @param {Object} [request] 请求对象。
   * @param {Object} [response] 响应对象。
   *
   * @returns {Error} 创建的错误。
   */
  constructor(message, code, config, request, response) {
    super(message);

    // 让 message 保持可枚举以向后兼容
    // 原生 Error 构造函数把 message 设为不可枚举,
    // 但 axios < v1.13.3 中它是可枚举的
    Object.defineProperty(this, 'message', {
      // 描述符带 null 原型,防止被污染的 Object.prototype.get
      // 在传入过程中把该数据描述符改写成访问器描述符。
      __proto__: null,
      value: message,
      enumerable: true,
      writable: true,
      configurable: true,
    });

    this.name = 'AxiosError';
    this.isAxiosError = true;
    code && (this.code = code);
    config && (this.config = config);
    request && (this.request = request);
    if (response) {
      this.response = response;
      this.status = response.status;
    }
  }

  toJSON() {
    // 可选脱敏:当请求配置带 `redact` 数组时,序列化快照中所有匹配键
    // (不区分大小写、任意深度)的值都会被替换为 REDACTED。
    // 未提供或为空则保持原有序列化行为不变。
    const config = this.config;
    const redactKeys = config && utils.hasOwnProp(config, 'redact') ? config.redact : undefined;
    const serializedConfig =
      utils.isArray(redactKeys) && redactKeys.length > 0
        ? redactConfig(config, redactKeys)
        : utils.toJSONObject(config);

    return {
      // 标准字段
      message: this.message,
      name: this.name,
      // Microsoft 风格字段
      description: this.description,
      number: this.number,
      // Mozilla 风格字段
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // axios 专有字段
      config: serializedConfig,
      code: this.code,
      status: this.status,
    };
  }
}

// 一旦 .eslint.cjs 的解析器选项更新,这里可以改成静态属性写法。
// 【中文注释】错误码常量:挂为实例属性(而非 static)以兼容当前构建工具链
AxiosError.ERR_BAD_OPTION_VALUE = 'ERR_BAD_OPTION_VALUE';
AxiosError.ERR_BAD_OPTION = 'ERR_BAD_OPTION';
AxiosError.ECONNABORTED = 'ECONNABORTED';
AxiosError.ETIMEDOUT = 'ETIMEDOUT';
AxiosError.ECONNREFUSED = 'ECONNREFUSED';
AxiosError.ERR_NETWORK = 'ERR_NETWORK';
AxiosError.ERR_FR_TOO_MANY_REDIRECTS = 'ERR_FR_TOO_MANY_REDIRECTS';
AxiosError.ERR_DEPRECATED = 'ERR_DEPRECATED';
AxiosError.ERR_BAD_RESPONSE = 'ERR_BAD_RESPONSE';
AxiosError.ERR_BAD_REQUEST = 'ERR_BAD_REQUEST';
AxiosError.ERR_CANCELED = 'ERR_CANCELED';
AxiosError.ERR_NOT_SUPPORT = 'ERR_NOT_SUPPORT';
AxiosError.ERR_INVALID_URL = 'ERR_INVALID_URL';
AxiosError.ERR_FORM_DATA_DEPTH_EXCEEDED = 'ERR_FORM_DATA_DEPTH_EXCEEDED';

export default AxiosError;
