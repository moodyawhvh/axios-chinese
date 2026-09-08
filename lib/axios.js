'use strict';

import utils from './utils.js';
import bind from './helpers/bind.js';
import Axios from './core/Axios.js';
import mergeConfig from './core/mergeConfig.js';
import defaults from './defaults/index.js';
import formDataToJSON from './helpers/formDataToJSON.js';
import CanceledError from './cancel/CanceledError.js';
import CancelToken from './cancel/CancelToken.js';
import isCancel from './cancel/isCancel.js';
import { VERSION } from './env/data.js';
import toFormData from './helpers/toFormData.js';
import AxiosError from './core/AxiosError.js';
import spread from './helpers/spread.js';
import isAxiosError from './helpers/isAxiosError.js';
import AxiosHeaders from './core/AxiosHeaders.js';
import adapters from './adapters/adapters.js';
import HttpStatusCode from './helpers/HttpStatusCode.js';

/**
 * 创建一个 Axios 实例
 * 【中文注释】axios 对外暴露的默认实例与 axios.create() 都由此工厂函数生成:
 * 1. 用默认配置 new 一个 Axios 上下文对象;
 * 2. 把 Axios.prototype.request 绑定到该上下文,得到可直接调用的函数形态实例;
 * 3. 把原型方法与上下文自身的属性都拷贝到实例上(allOwnKeys 保证不可枚举键也被复制);
 * 4. 挂上 create 工厂,基于「默认配置 + 新配置」的合并结果再生成子实例。
 *
 * @param {Object} defaultConfig 实例的默认配置
 *
 * @returns {Axios} 一个新的 Axios 实例
 */
function createInstance(defaultConfig) {
  const context = new Axios(defaultConfig);
  // 将 request 方法绑定到 context,使 instance 可作为函数直接调用
  const instance = bind(Axios.prototype.request, context);

  // 把 axios.prototype 拷贝到实例上(含 get/post/put 等快捷方法)
  utils.extend(instance, Axios.prototype, context, { allOwnKeys: true });

  // 把 context(拦截器管理器、defaults 等)拷贝到实例上
  utils.extend(instance, context, null, { allOwnKeys: true });

  // 用于创建新实例的工厂(axios.create 的实现),配置按 mergeConfig 合并
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// 创建并对导出的默认实例
const axios = createInstance(defaults);

// 暴露 Axios 类,便于类继承扩展
axios.Axios = Axios;

// 暴露取消相关能力:CanceledError / CancelToken / isCancel
axios.CanceledError = CanceledError;
axios.CancelToken = CancelToken;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData;

// 暴露 AxiosError 错误类
axios.AxiosError = AxiosError;

// Cancel 作为 CanceledError 的别名保留,向后兼容旧版本
axios.Cancel = axios.CanceledError;

// 暴露 all(Promise.all 的别名)与 spread
axios.all = function all(promises) {
  return Promise.all(promises);
};

axios.spread = spread;

// 暴露 isAxiosError,用于判断一个对象是否为 axios 错误
axios.isAxiosError = isAxiosError;

// 暴露 mergeConfig,用于合并两份请求配置
axios.mergeConfig = mergeConfig;

// 暴露 AxiosHeaders 请求头操作类
axios.AxiosHeaders = AxiosHeaders;

// formToJSON:把 HTML 表单或 FormData 反序列化为普通 JSON 对象
axios.formToJSON = (thing) => formDataToJSON(utils.isHTMLForm(thing) ? new FormData(thing) : thing);

// 暴露适配器选择逻辑(按环境自动挑 xhr/fetch/http,或用指定适配器)
axios.getAdapter = adapters.getAdapter;

// 暴露 HTTP 状态码常量表
axios.HttpStatusCode = HttpStatusCode;

axios.default = axios;

// 本模块只应有默认导出
export default axios;
