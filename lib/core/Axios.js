'use strict';

import utils from '../utils.js';
import buildURL from '../helpers/buildURL.js';
import InterceptorManager from './InterceptorManager.js';
import dispatchRequest from './dispatchRequest.js';
import mergeConfig from './mergeConfig.js';
import buildFullPath from './buildFullPath.js';
import methodList from './methodList.js';
import validator from '../helpers/validator.js';
import AxiosHeaders from './AxiosHeaders.js';
import transitionalDefaults from '../defaults/transitional.js';

const validators = validator.validators;

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 *
 * @return {Axios} A new instance of Axios
 *
 * 【中文注释】Axios 核心类:
 * - 每个 Axios 实例持有自己的 defaults(默认配置)与请求/响应拦截器管理器;
 * - 所有请求方法(get/post/...)最终都会汇聚到 request() → _request();
 * - _request() 负责合并配置、校验选项、展平请求头、
 *   组装拦截器链并按同步/异步两条路径发起请求。
 */
class Axios {
  constructor(instanceConfig) {
    // 实例默认配置;未传入时为空对象
    this.defaults = instanceConfig || {};
    // 请求/响应拦截器管理器,分别维护各自的拦截器队列
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager(),
    };
  }

  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   *
   * 【中文注释】对外统一的请求入口(异步包装):
   * - 支持 axios('url', config) / axios(config) / axios.get(...) 等调用方式;
   * - 失败时对 err.stack 做补充:部分环境(如拦截器抛错、自定义错误)丢失堆栈,
   *   这里用一次"哑错误"捕获当前调用点的堆栈,截掉首行后附加到原错误上,
   *   使开发者能在调用处看到完整的堆栈来源;任何堆栈修补失败都会被忽略。
   */
  async request(configOrUrl, config) {
    try {
      return await this._request(configOrUrl, config);
    } catch (err) {
      if (err instanceof Error) {
        try {
          let dummy = {};

          Error.captureStackTrace ? Error.captureStackTrace(dummy) : (dummy = new Error());

          const dummyStack = dummy.stack;
          let stack = '';

          // slice off the Error: ... line
          if (typeof dummyStack === 'string') {
            const firstNewlineIndex = dummyStack.indexOf('\n');

            stack = firstNewlineIndex === -1 ? '' : dummyStack.slice(firstNewlineIndex + 1);
          }

          if (!err.stack) {
            err.stack = stack;
            // match without the 2 top stack lines
          } else if (stack) {
            const firstNewlineIndex = stack.indexOf('\n');
            const secondNewlineIndex =
              firstNewlineIndex === -1 ? -1 : stack.indexOf('\n', firstNewlineIndex + 1);
            const stackWithoutTwoTopLines =
              secondNewlineIndex === -1 ? '' : stack.slice(secondNewlineIndex + 1);

            if (!String(err.stack).endsWith(stackWithoutTwoTopLines)) {
              err.stack += '\n' + stack;
            }
          }
        } catch (e) {
          // Ignore failures from custom stack hooks or un-writable stack properties.
        }
      }

      throw err;
    }
  }

  /**
   * 【中文注释】请求的同步主体:
   * 1. 规范化入参(字符串 URL 或配置对象);
   * 2. mergeConfig 与实例默认配置合并;
   * 3. 校验 transitional / paramsSerializer 等选项的合法性;
   * 4. 解析 method 并展平 headers(合并 common 与按 method 分组的头);
   * 5. 组装请求/响应拦截器链;
   * 6. 全部请求拦截器均为同步时走同步执行路径,否则走 Promise 链。
   */
  _request(configOrUrl, config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof configOrUrl === 'string') {
      config = config || {};
      config.url = configOrUrl;
    } else {
      config = configOrUrl || {};
    }

    // 将实例默认配置与本次请求配置深度合并,请求级配置优先
    config = mergeConfig(this.defaults, config);

    const { transitional, paramsSerializer, headers } = config;

    // transitional 为过渡性开关集合(如 clarifyTimeoutError),逐项校验类型
    if (transitional !== undefined) {
      validator.assertOptions(
        transitional,
        {
          silentJSONParsing: validators.transitional(validators.boolean),
          forcedJSONParsing: validators.transitional(validators.boolean),
          clarifyTimeoutError: validators.transitional(validators.boolean),
          legacyInterceptorReqResOrdering: validators.transitional(validators.boolean),
          advertiseZstdAcceptEncoding: validators.transitional(validators.boolean),
          validateStatusUndefinedResolves: validators.transitional(validators.boolean),
        },
        false
      );
    }

    // paramsSerializer 既可以是函数,也可以是 { encode, serialize } 对象
    if (paramsSerializer != null) {
      if (utils.isFunction(paramsSerializer)) {
        config.paramsSerializer = {
          serialize: paramsSerializer,
        };
      } else {
        validator.assertOptions(
          paramsSerializer,
          {
            encode: validators.function,
            serialize: validators.function,
          },
          true
        );
      }
    }

    // Set config.allowAbsoluteUrls
    if (config.allowAbsoluteUrls !== undefined) {
      // do nothing
    } else if (this.defaults.allowAbsoluteUrls !== undefined) {
      config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
    } else {
      config.allowAbsoluteUrls = true;
    }

    // 常见拼写错误提示:baseUrl → baseURL、withXsrfToken → withXSRFToken
    validator.assertOptions(
      config,
      {
        baseUrl: validators.spelling('baseURL'),
        withXsrfToken: validators.spelling('withXSRFToken'),
      },
      true
    );

    // Set config.method
    config.method = (
      utils.getSafeProp(config, 'method') ||
      utils.getSafeProp(this.defaults, 'method') ||
      'get'
    ).toLowerCase();

    // Flatten headers
    // 合并 common 头与当前 method 专属头,再删除按 method 分组的结构,
    // 最终得到一个扁平的 AxiosHeaders 实例
    let contextHeaders = headers && utils.merge(headers.common, headers[config.method]);

    headers &&
      utils.forEach(methodList.concat('common'), (method) => {
        delete headers[method];
      });

    config.headers = AxiosHeaders.concat(contextHeaders, headers);

    // filter out skipped interceptors
    // 组装请求拦截器链:跳过 runWhen 返回 false 的拦截器;
    // 记录是否存在异步拦截器;legacy 模式下用 unshift 保持旧版执行顺序
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
        return;
      }

      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

      const transitional = config.transitional || transitionalDefaults;
      const legacyInterceptorReqResOrdering =
        transitional && transitional.legacyInterceptorReqResOrdering;

      if (legacyInterceptorReqResOrdering) {
        requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
      } else {
        requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
      }
    });

    // 响应拦截器链按注册顺序依次执行
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    let promise;
    let i = 0;
    let len;

    if (!synchronousRequestInterceptors) {
      /* 【中文注释】异步路径:把 dispatchRequest 放在链中间,
         前面是请求拦截器(fulfilled/rejected 成对),后面是响应拦截器,
         通过 while 循环依次 then 串起来 */
      const chain = [dispatchRequest.bind(this), undefined];
      chain.unshift(...requestInterceptorChain);
      chain.push(...responseInterceptorChain);
      len = chain.length;

      promise = Promise.resolve(config);

      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }

      return promise;
    }

    /* 【中文注释】同步路径:请求拦截器全部为 synchronous 时,
       在当前栈内依次同步执行,避免额外微任务带来的时序变化 */
    len = requestInterceptorChain.length;

    let newConfig = config;

    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled ? onFulfilled(newConfig) : newConfig;
      } catch (error) {
        if (!onRejected) {
          promise = Promise.reject(error);
          break;
        }

        try {
          const rejectedResult = onRejected.call(this, error);

          if (utils.isThenable(rejectedResult)) {
            promise = Promise.resolve(rejectedResult).then(() =>
              dispatchRequest.call(this, newConfig)
            );
          }
        } catch (rejectedError) {
          promise = Promise.reject(rejectedError);
        }

        break;
      }
    }

    if (!promise) {
      try {
        promise = dispatchRequest.call(this, newConfig);
      } catch (error) {
        promise = Promise.reject(error);
      }
    }

    i = 0;
    len = responseInterceptorChain.length;

    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }

    return promise;
  }

  /**
   * 【中文注释】仅构建最终请求 URL(不发起请求):
   * 合并 baseURL 与 url,再拼上序列化后的查询参数
   */
  getUri(config) {
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls, config);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
}

// Provide aliases for supported request methods
// 【中文注释】为无请求体的方法(delete/get/head/options)生成快捷别名
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function (url, config) {
    return this.request(
      mergeConfig(config || {}, {
        method,
        url,
        data: config && utils.hasOwnProp(config, 'data') ? config.data : undefined,
      })
    );
  };
});

// 【中文注释】为携带请求体的方法(post/put/patch/query)生成快捷别名;
// *Form 变体会自动设置 multipart/form-data 的 Content-Type
utils.forEach(['post', 'put', 'patch', 'query'], function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(
        mergeConfig(config || {}, {
          method,
          headers: isForm
            ? {
                'Content-Type': 'multipart/form-data',
              }
            : {},
          url,
          data,
        })
      );
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  // QUERY is a safe/idempotent read method; multipart form bodies don't fit
  // its semantics, so no queryForm shorthand is generated.
  if (method !== 'query') {
    Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
  }
});

export default Axios;
