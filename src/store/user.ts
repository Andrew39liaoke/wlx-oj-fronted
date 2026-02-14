// initial state
import { StoreOptions } from 'vuex';
import ACCESS_ENUM from '@/access/accessEnum';
import { UserControllerService, OpenAPI } from '../../generated';

export default {
  namespaced: true,
  state: () => ({
    loginUser: {
      nickName: '未登录',
    },
    token: localStorage.getItem('token') || '',
  }),
  actions: {
    async getLoginUser({ commit, state }, payload) {
      // 从远程请求获取登录信息
      try {
        const res = await UserControllerService.getLoginUser();
        if (res.code === 0) {
          commit('updateUser', res.data);
        } else {
          commit('updateUser', {
            ...state.loginUser,
            userRole: ACCESS_ENUM.NOT_LOGIN,
          });
        }
      } catch (error) {
        commit('updateUser', {
          ...state.loginUser,
          userRole: ACCESS_ENUM.NOT_LOGIN,
        });
      }
    },
    async setToken({ commit }, token: string) {
      // 单独提交 token 更新，不复用 updateUser
      commit('setToken', token);
    },
  },
  mutations: {
    updateUser(state, payload) {
      state.loginUser = payload;
    },
    setToken(state, token: string) {
      state.token = token;
      localStorage.setItem('token', token);
      // 使用 OpenAPI.HEADERS 代替 OpenAPI.TOKEN，以避免生成的代码自动添加 "Bearer " 前缀
      OpenAPI.HEADERS = {
        Authorization: token,
      };
    },
  },
} as StoreOptions<any>;

// 初始化时如果本地有 token，则设置到 API 配置中
if (localStorage.getItem('token')) {
  OpenAPI.HEADERS = {
    Authorization: localStorage.getItem('token') as string,
  };
}
