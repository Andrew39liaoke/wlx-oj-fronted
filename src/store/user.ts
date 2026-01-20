// initial state
import { StoreOptions } from "vuex";
import ACCESS_ENUM from "@/access/accessEnum";
import { UserControllerService, OpenAPI } from "../../generated";

export default {
  namespaced: true,
  state: () => ({
    loginUser: {
      nickName: "未登录",
    },
    token: localStorage.getItem("token") || "",
  }),
  actions: {
    async getLoginUser({ commit, state }, payload) {
      // 从远程请求获取登录信息
      try {
        const res = await UserControllerService.getLoginUser();
        if (res.code === 0) {
          commit("updateUser", res.data);
        } else {
          commit("updateUser", {
            ...state.loginUser,
            userRole: ACCESS_ENUM.NOT_LOGIN,
          });
        }
      } catch (error) {
        commit("updateUser", {
          ...state.loginUser,
          userRole: ACCESS_ENUM.NOT_LOGIN,
        });
      }
    },
  },
  mutations: {
    updateUser(state, payload) {
      state.loginUser = payload;
      // 如果 payload 中包含 token，自动设置 token
      if (payload?.token) {
        state.token = payload.token;
        localStorage.setItem("token", payload.token);
        // 使用 OpenAPI.HEADERS 代替 OpenAPI.TOKEN，以避免生成的代码自动添加 "Bearer " 前缀
        OpenAPI.HEADERS = {
          Authorization: payload.token,
        };
      }
    },
  },
} as StoreOptions<any>;

// 初始化时如果本地有 token，则设置到 API 配置中
if (localStorage.getItem("token")) {
  OpenAPI.HEADERS = {
    Authorization: localStorage.getItem("token") as string,
  };
}
