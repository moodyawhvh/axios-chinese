'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import adapters from '../adapters/adapters.js';
import utils from '../utils.js';

/**
 * Throws a `CanceledError` if cancellation has been requested.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 *
 * 【中文注释】取消检查:同时支持旧版 CancelToken 与新版 AbortSignal。
 * 若调用方已请求取消,立即抛出 CanceledError,不再继续请求流程。
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError(null, config);
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 *
 * @returns {Promise} The Promise to be fulfilled
 *
 * 【中文注释】请求分发核心:拦截器链的中枢。
 * 职责顺序:配置加固 → 取消检查 → 请求头规范化 → 请求转换器 →
 * 选择适配器并执行 → 响应/错误转换。
 */
export default function dispatchRequest(_config) {
  // Interceptors may replace the merged config with an ordinary object. Flatten
  // it at the dispatch boundary so shared prototype members cannot become
  // request behavior, while preserving intentional template/class members.
  // 【中文注释】安全加固:拦截器可能用普通对象替换已合并的配置,
  // 在分发边界做扁平化过滤,防止共享原型上的成员(如被污染的
  // Object.prototype 属性)变成请求行为,同时保留有意的模板/类成员。
  const config = utils.toSafeFlatObject(_config);

  throwIfCancellationRequested(config);

  // 把 headers 配置统一转换为 AxiosHeaders 实例,提供大小写不敏感操作
  config.headers = AxiosHeaders.from(utils.getSafeProp(config, 'headers'));

  // Transform request data
  // 依次执行 transformRequest 转换器链(默认含默认序列化逻辑)
  config.data = transformData.call(config, config.transformRequest);

  // 对写方法补一个默认 Content-Type(rewrite=false 表示不覆盖已设置的头)
  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  // 按配置或全局默认选择适配器(xhr / http / fetch 或自定义)
  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);

  return adapter(config).then(
    function onAdapterResolution(response) {
      // 适配器返回后再次检查取消,避免"取消发生在响应送达前"被吞掉
      throwIfCancellationRequested(config);

      // Expose the current response on config so that transformResponse can
      // attach it to any AxiosError it throws (e.g. on JSON parse failure).
      // We clean it up afterwards to avoid polluting the config object.
      // 【中文注释】临时把响应挂到 config 上,让 transformResponse 抛错时
      // 能把响应附到 AxiosError 上(如 JSON 解析失败),用完立即清除,
      // 避免污染配置对象。
      config.response = response;
      try {
        response.data = transformData.call(config, config.transformResponse, response);
      } finally {
        delete config.response;
      }

      // 响应头同样转换为 AxiosHeaders,保证读取接口一致
      response.headers = AxiosHeaders.from(response.headers);

      return response;
    },
    function onAdapterRejection(reason) {
      // 取消错误不重复做取消检查;其余错误仍需检查"请求后取消"的情况
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);

        // Transform response data
        // 错误响应也走 transformResponse 链(如统一解析错误体 JSON)
        if (reason && reason.response) {
          config.response = reason.response;
          try {
            reason.response.data = transformData.call(
              config,
              config.transformResponse,
              reason.response
            );
          } finally {
            delete config.response;
          }
          reason.response.headers = AxiosHeaders.from(reason.response.headers);
        }
      }

      return Promise.reject(reason);
    }
  );
}
